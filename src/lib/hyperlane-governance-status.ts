import {
  evmAdministration,
  safeAddress,
  squads,
  terraContracts,
  terraGovernanceAddress,
} from "../data/hyperlane-governance";
import { terraClassicEndpoints } from "../data/terra-classic-endpoints";
import type {
  AdministrationConfig,
  ContractAuthority,
  GovernanceAction,
  GovernanceNetwork,
  GovernanceSource,
  HyperlaneGovernanceSnapshot,
} from "../types/hyperlane-governance";
import {
  accountBytes,
  base58,
  list,
  matchesTerraContracts,
  parseSafeAction,
  parseSafeConfig,
  parseSquadsConfig,
  parseSquadsProposal,
  parseTerraAction,
  proposalDiscriminator,
  record,
  str,
} from "./hyperlane-governance-parsers";

async function json(
  url: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        ...headers,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
    });
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? "Source rate limit reached. Try again later."
          : `Source returned HTTP ${response.status}.`,
      );
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}
async function source<T>(
  url: string,
  load: () => Promise<T>,
  limited = false,
): Promise<GovernanceSource<T>> {
  try {
    const data = await load();
    return { url, checkedAt: new Date().toISOString(), data, limited };
  } catch (error) {
    return {
      url,
      checkedAt: new Date().toISOString(),
      error:
        error instanceof Error && error.name !== "AbortError"
          ? error.message
          : "Source request timed out.",
    };
  }
}
async function rpc(
  url: string,
  method: string,
  params: unknown[],
): Promise<unknown> {
  const response = record(
    await json(url, { jsonrpc: "2.0", id: 1, method, params }),
  );
  if (response.error || response.result === undefined)
    throw new Error("RPC could not return the requested state.");
  return response.result;
}
function evmAddress(value: unknown): string | null | undefined {
  if (typeof value !== "string" || !/^0x0{24}[0-9a-f]{40}$/i.test(value))
    return undefined;
  return /^0x0{64}$/.test(value) ? null : `0x${value.slice(-40)}`;
}
async function loadEvmState(network: (typeof evmAdministration)[number]) {
  const block = str(await rpc(network.rpc, "eth_blockNumber", []));
  if (!block) throw new Error("Block number unavailable.");
  const calls = network.contracts.flatMap(([, address], i) =>
    ["0x8da5cb5b", "0xe30c3978"].map((selector, j) => ({
      jsonrpc: "2.0",
      id: i * 2 + j,
      method: "eth_call",
      params: [{ to: String(address), data: selector }, block],
    })),
  );
  calls.push(
    ...["0xa0e67e2b", "0xe75235b8", "0xaffed0e0"].map((selector, i) => ({
      jsonrpc: "2.0",
      id: 100 + i,
      method: "eth_call",
      params: [{ to: safeAddress, data: selector }, block],
    })),
  );
  const result = list(await json(network.rpc, calls)).map(record);
  let config: AdministrationConfig | undefined;
  try {
    const ownersData = str(result.find((v) => v.id === 100)?.result);
    if (
      !ownersData ||
      !/^0x[0-9a-f]+$/i.test(ownersData) ||
      ownersData.length < 130
    )
      throw new Error("Invalid owners ABI.");
    const words = ownersData.slice(2).match(/.{64}/g)!;
    if (BigInt(`0x${words[0]}`) !== 32n)
      throw new Error("Invalid owners ABI offset.");
    const count = Number(BigInt(`0x${words[1]}`));
    if (
      !Number.isSafeInteger(count) ||
      count < 1 ||
      count > 100 ||
      words.length !== count + 2
    )
      throw new Error("Invalid owners ABI length.");
    config = parseSafeConfig({
      address: safeAddress,
      owners: words.slice(2).map((word) => evmAddress(`0x${word}`)),
      threshold: Number(
        BigInt(String(result.find((v) => v.id === 101)?.result)),
      ),
      nonce: Number(BigInt(String(result.find((v) => v.id === 102)?.result))),
    });
  } catch {
    /* Keep independent contract authority reads when Safe configuration cannot be decoded. */
  }
  const rows = network.contracts.map(([label, address], i) => {
    const owner = evmAddress(result.find((v) => v.id === i * 2)?.result);
    const pendingOwner = evmAddress(
      result.find((v) => v.id === i * 2 + 1)?.result,
    );
    return {
      label,
      address,
      url: `${network.explorer}/address/${address}#readContract`,
      owner,
      pendingOwner,
      note: `Read at block ${Number.parseInt(block, 16)}. ${pendingOwner === undefined ? "pendingOwner() unavailable or not exposed. " : ""}${label.includes("ProxyAdmin") ? "Owner of the documented ProxyAdmin; current proxy linkage is not checked." : "Owner role only; does not establish control of proxy upgrades."}`,
    };
  });
  return { configuration: config, authorities: rows };
}
async function loadSafe(
  network: (typeof evmAdministration)[number],
  safeJson: (url: string) => Promise<unknown>,
): Promise<GovernanceNetwork> {
  const base = `${network.service}/api/v1/safes/${safeAddress}/`;
  const statePromise = source(network.rpc, () => loadEvmState(network));
  const pendingUrl = `${base}multisig-transactions/?executed=false&limit=100`;
  const historyUrl = `${base}multisig-transactions/?executed=true&limit=10`;
  const pendingPromise = source(pendingUrl, async () =>
    record(await safeJson(pendingUrl)),
  );
  const historyPromise = source(historyUrl, async () =>
    record(await safeJson(historyUrl)),
  );
  const [state, rawPending, rawHistory] = await Promise.all([
    statePromise,
    pendingPromise,
    historyPromise,
  ]);
  const configuration: GovernanceSource<AdministrationConfig> = state.data
    ?.configuration
    ? {
        url: network.rpc,
        checkedAt: state.checkedAt,
        data: state.data.configuration,
      }
    : await source(base, async () => parseSafeConfig(await safeJson(base)));
  const authorities: GovernanceSource<ContractAuthority[]> = {
    url: network.rpc,
    checkedAt: state.checkedAt,
    data: state.data?.authorities.some((a) => a.owner !== undefined)
      ? state.data.authorities
      : undefined,
    error:
      state.error ??
      (state.data?.authorities.every((a) => a.owner === undefined)
        ? "Contract owner reads unavailable."
        : undefined),
  };
  const convert = (
    raw: GovernanceSource<Record<string, unknown>>,
  ): GovernanceSource<GovernanceAction[]> => {
    if (!raw.data)
      return { url: raw.url, checkedAt: raw.checkedAt, error: raw.error };
    try {
      return {
        url: raw.url,
        checkedAt: raw.checkedAt,
        limited: !!raw.data.next,
        data: list(raw.data.results).map((tx) =>
          parseSafeAction(
            tx,
            configuration.data,
            network.prefix,
            network.explorer,
          ),
        ),
      };
    } catch {
      return {
        url: raw.url,
        checkedAt: raw.checkedAt,
        error: "Could not decode the transaction list.",
      };
    }
  };
  const pending = convert(rawPending);
  // Consumed nonces are neither outstanding approvals nor executed transactions.
  if (pending.data)
    pending.data = pending.data
      .filter((tx) => tx.active)
      .sort((a, b) => (a.nonce ?? 0) - (b.nonce ?? 0));
  return {
    id: network.id,
    name: network.name,
    reviewUrl: `https://app.safe.global/transactions/queue?safe=${network.prefix}:${safeAddress}`,
    configuration,
    pending,
    history: convert(rawHistory),
    authorities,
  };
}

async function terraProposals(
  endpoint: string,
  status?: string,
): Promise<{ actions: GovernanceAction[]; limited: boolean }> {
  const query = status
    ? `proposal_status=${status}&pagination.limit=100`
    : "pagination.limit=30&pagination.reverse=true";
  const payload = record(
    await json(`${endpoint}/cosmos/gov/v1/proposals?${query}`),
  );
  const proposals = list(payload.proposals).filter((v) =>
    matchesTerraContracts(record(v).messages),
  );
  return {
    actions: proposals.map(parseTerraAction),
    limited: !status || !!record(payload.pagination).next_key,
  };
}
async function terraAuthorities(
  endpoint: string,
): Promise<ContractAuthority[]> {
  const rows = await Promise.all(
    terraContracts
      .filter((c) => "monitor" in c && c.monitor)
      .map(async ({ label, address }) => {
        const url = `${endpoint}/cosmwasm/wasm/v1/contract/${address}`;
        const query = (name: string) =>
          json(
            `${url}/smart/${encodeURIComponent(btoa(JSON.stringify({ ownable: { [name]: {} } })))}`,
          );
        const [ownerResult, pendingResult, infoResult] =
          await Promise.allSettled([
            query("get_owner"),
            query("get_pending_owner"),
            json(url),
          ]);
        const field = (
          result: PromiseSettledResult<unknown>,
          container: string,
          key: string,
        ): string | null | undefined => {
          if (result.status === "rejected") return undefined;
          try {
            const value = record(record(result.value)[container])[key];
            return value === null || value === "" ? null : str(value);
          } catch {
            return undefined;
          }
        };
        return {
          label,
          address,
          url,
          owner: field(ownerResult, "data", "owner"),
          pendingOwner: field(pendingResult, "data", "pending_owner"),
          admin: field(infoResult, "contract_info", "admin"),
          adminLabel: "Migration admin",
          note: "Contract owner and CosmWasm migration admin are independent roles. Unavailable fields are not proof of renounced ownership.",
        };
      }),
  );
  if (rows.every((row) => row.owner === undefined && row.admin === undefined))
    throw new Error("Contract authority reads unavailable.");
  return rows;
}
async function loadTerra(): Promise<GovernanceNetwork> {
  let endpoint: string = terraClassicEndpoints.lcd[0];
  let configuration: GovernanceSource<AdministrationConfig> | undefined;
  // Pick one functioning LCD, then share it; avoid multiplying every contract read by all fallbacks.
  for (const candidate of terraClassicEndpoints.lcd) {
    const url = `${candidate}/cosmos/auth/v1beta1/module_accounts`;
    const result = await source(
      url,
      async (): Promise<AdministrationConfig> => {
        const accounts = list(record(await json(url)).accounts).map(record);
        const gov = accounts.find((v) => v.name === "gov");
        if (
          !gov ||
          str(record(gov.base_account).address) !== terraGovernanceAddress
        )
          throw new Error("Governance module address could not be verified.");
        return { address: terraGovernanceAddress, kind: "On-chain governance" };
      },
    );
    configuration = result;
    if (result.data) {
      endpoint = candidate;
      break;
    }
  }
  const proposalsUrl = `${endpoint}/cosmos/gov/v1/proposals`;
  const [rawPending, rawHistory, authorities] = await Promise.all([
    source(proposalsUrl, async () => {
      const [voting, deposit] = await Promise.all([
        terraProposals(endpoint, "PROPOSAL_STATUS_VOTING_PERIOD"),
        terraProposals(endpoint, "PROPOSAL_STATUS_DEPOSIT_PERIOD"),
      ]);
      const actions = [
        ...new Map(
          [...voting.actions, ...deposit.actions].map((a) => [a.id, a]),
        ).values(),
      ];
      // Keep proposal discovery usable if an individual live tally is unavailable.
      await Promise.all(
        actions
          .slice(0, 5)
          .filter((a) => a.status === "Voting")
          .map(async (action) => {
            try {
              const tally = record(
                record(await json(`${proposalsUrl}/${action.id}/tally`)).tally,
              );
              action.tally = Object.fromEntries(
                Object.entries(tally).filter(
                  (entry): entry is [string, string] =>
                    typeof entry[1] === "string",
                ),
              );
            } catch {
              action.detail += " Live tally unavailable.";
            }
          }),
      );
      return { actions, limited: voting.limited || deposit.limited };
    }),
    source(proposalsUrl, () => terraProposals(endpoint)),
    source(endpoint, () => terraAuthorities(endpoint)),
  ]);
  const convert = (
    raw: GovernanceSource<{ actions: GovernanceAction[]; limited: boolean }>,
    active: boolean,
  ): GovernanceSource<GovernanceAction[]> => ({
    url: raw.url,
    checkedAt: raw.checkedAt,
    error: raw.error,
    data: raw.data?.actions.filter((a) => a.active === active),
    limited: raw.data?.limited,
  });
  return {
    id: "terra",
    name: "Terra Classic",
    reviewUrl: "https://www.validator.info/terra-classic/governance",
    configuration: configuration!,
    pending: convert(rawPending, true),
    history: convert(rawHistory, false),
    authorities,
  };
}

async function solanaUpgrades(): Promise<ContractAuthority[]> {
  const programs = [
    ["LUNC Warp program", "Dd3ajD8WbEyx7z3HqPnDyvUgFqEBzvF1VePjYd1NGnbr"],
    ["USTC Warp program", "7CUdBt1Qn2R2StE7MDPhQW2EhmnGg8zKK8oJXwAGEoyf"],
    ["ISM program", "4MzF7HCfxuwj4EFHqZSEpvkcZZvv1mF37DP4pDHwR5VQ"],
  ];
  const loader = "BPFLoaderUpgradeab1e11111111111111111111111";
  const payload = record(
    await rpc(squads.rpc, "getMultipleAccounts", [
      programs.map((p) => p[1]),
      { encoding: "base64", commitment: "confirmed" },
    ]),
  );
  const accounts = list(payload.value).map(record);
  const dataAddresses = accounts.map((a) => {
    const bytes = accountBytes(a);
    if (
      a.owner !== loader ||
      !a.executable ||
      bytes.length < 36 ||
      new DataView(bytes.buffer).getUint32(0, true) !== 2
    )
      throw new Error("Unexpected upgradeable program account.");
    return base58(bytes.slice(4, 36));
  });
  const dataPayload = record(
    await rpc(squads.rpc, "getMultipleAccounts", [
      dataAddresses,
      { encoding: "base64", commitment: "confirmed" },
    ]),
  );
  return list(dataPayload.value).map((value, i) => {
    const a = record(value);
    const bytes = accountBytes(a);
    if (
      a.owner !== loader ||
      bytes.length < 13 ||
      new DataView(bytes.buffer).getUint32(0, true) !== 3 ||
      bytes[12] > 1 ||
      (bytes[12] === 1 && bytes.length < 45)
    )
      throw new Error("Unexpected program data account.");
    return {
      label: programs[i][0],
      address: programs[i][1],
      url: `https://solscan.io/account/${programs[i][1]}`,
      admin: bytes[12] === 0 ? null : base58(bytes.slice(13, 45)),
      adminLabel: "Upgrade authority",
      note: "Program upgrade authority only. Hyperlane operational owner/IGP authority is not decoded by this panel.",
    };
  });
}
async function loadSolana(): Promise<GovernanceNetwork> {
  const configPromise = source(squads.rpc, async () =>
    parseSquadsConfig(
      record(
        await rpc(squads.rpc, "getAccountInfo", [
          squads.multisig,
          { encoding: "base64", commitment: "confirmed" },
        ]),
      ).value,
    ),
  );
  const rawProposalsPromise = source(squads.rpc, async () =>
    list(
      await rpc(squads.rpc, "getProgramAccounts", [
        squads.program,
        {
          encoding: "base64",
          commitment: "confirmed",
          filters: [
            {
              memcmp: {
                offset: 0,
                bytes: base58(Uint8Array.from(proposalDiscriminator)),
              },
            },
            { memcmp: { offset: 8, bytes: squads.multisig } },
          ],
        },
      ]),
    ),
  );
  const authoritiesPromise = source(squads.rpc, solanaUpgrades);
  const [configuration, raw, authorities] = await Promise.all([
    configPromise,
    rawProposalsPromise,
    authoritiesPromise,
  ]);
  let actions: GovernanceAction[] | undefined;
  let error = raw.error ?? configuration.error;
  if (raw.data && configuration.data) {
    try {
      actions = raw.data
        .map((entry) => {
          const v = record(entry);
          const pubkey = str(v.pubkey);
          if (!pubkey) throw new Error("Missing proposal address.");
          return parseSquadsProposal(v.account, pubkey, configuration.data!);
        })
        .sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));
    } catch {
      error = "Could not decode Squads proposals.";
    }
  }
  const common = { url: squads.rpc, checkedAt: raw.checkedAt, error };
  return {
    id: "solana",
    name: "Solana",
    reviewUrl: squads.url,
    configuration,
    pending: { ...common, data: actions?.filter((a) => a.active) },
    history: {
      ...common,
      limited: true,
      data: actions?.filter((a) => !a.active).slice(0, 10),
    },
    authorities,
  };
}

export type GovernanceOptions = { safeApiKey?: string };
export async function loadHyperlaneGovernanceSnapshot(
  options: GovernanceOptions = {},
): Promise<HyperlaneGovernanceSnapshot> {
  // Unauthenticated Safe access allows only two requests per second. Space starts
  // across both chains; HTTP errors are surfaced, not retried in a tight loop.
  let nextSafeRequest = Date.now();
  const safeJson = async (url: string) => {
    const delay = Math.max(0, nextSafeRequest - Date.now());
    nextSafeRequest = Math.max(Date.now(), nextSafeRequest) + 600;
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    return json(
      url,
      undefined,
      options.safeApiKey
        ? { Authorization: `Bearer ${options.safeApiKey}` }
        : {},
    );
  };
  const networks = await Promise.all([
    loadTerra(),
    ...evmAdministration.map((network) => loadSafe(network, safeJson)),
    loadSolana(),
  ]);
  return { fetchedAt: new Date().toISOString(), networks };
}
let cache: { expires: number; value: HyperlaneGovernanceSnapshot } | undefined;
let inFlight: Promise<HyperlaneGovernanceSnapshot> | undefined;
export async function getHyperlaneGovernanceSnapshot(
  options: GovernanceOptions = {},
): Promise<HyperlaneGovernanceSnapshot> {
  if (cache && cache.expires > Date.now()) return cache.value;
  if (!inFlight) {
    inFlight = loadHyperlaneGovernanceSnapshot(options)
      .then((value) => {
        cache = { expires: Date.now() + 60_000, value };
        return value;
      })
      .finally(() => {
        inFlight = undefined;
      });
  }
  return inFlight;
}
