import { hyperlaneNetworkConfiguration } from "../data/hyperlane-networks";
import { hyperlaneValidators } from "../data/hyperlane-validators";
import { terraClassicEndpoints } from "../data/terra-classic-endpoints";
import type {
  HyperlaneDestinationConfiguration,
  HyperlaneRouteSnapshot,
  HyperlaneSecuritySnapshot,
  HyperlaneValidatorProfile,
  HyperlaneValidatorSnapshot,
} from "../types/hyperlane";

type TerraValidatorState = {
  readonly validators: readonly string[];
  readonly storageLocations: ReadonlyMap<string, readonly string[]>;
  readonly merkleTreeCount?: number;
};

type CheckpointState = {
  readonly index?: number;
  readonly updatedAt?: string;
};

const REQUEST_TIMEOUT_MS = 8_000;
const VALIDATORS_AND_THRESHOLD_CALL_DATA = `0x2e0ed234${"0".repeat(62)}20${"0".repeat(64)}`;
const ADDRESS_PATTERN = /^0x[0-9a-f]{40}$/;
const S3_BUCKET_PATTERN = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const S3_REGION_PATTERN = /^[a-z0-9-]+$/;
const validatorMetadataByAddress = new Map<string, HyperlaneValidatorProfile>(
  hyperlaneValidators.map((validator) => [validator.address.toLowerCase(), validator]),
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeValidatorAddress(value: string): string | undefined {
  const normalized = value.startsWith("0x") ? value.toLowerCase() : `0x${value.toLowerCase()}`;
  return ADDRESS_PATTERN.test(normalized) ? normalized : undefined;
}

function normalizeWebsite(value?: string): string | undefined {
  const website = value?.trim();
  if (!website) {
    return undefined;
  }

  try {
    const url = new URL(website);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function encodeBase64(value: string): string {
  return btoa(value);
}

async function fetchWithTimeout(input: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJson(input: string, init?: RequestInit): Promise<unknown> {
  const response = await fetchWithTimeout(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }
  return await response.json();
}

async function queryTerraContract(contract: string, message: Record<string, unknown>): Promise<unknown> {
  const encodedMessage = encodeURIComponent(encodeBase64(JSON.stringify(message)));
  let lastError: unknown;

  for (const endpoint of terraClassicEndpoints.lcd) {
    try {
      return await fetchJson(`${endpoint}/cosmwasm/wasm/v1/contract/${contract}/smart/${encodedMessage}`, {
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Every Terra Classic LCD endpoint failed.");
}

function parseAnnouncedValidators(payload: unknown): readonly string[] {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.validators)) {
    throw new Error("Validator Announce returned an invalid validator list.");
  }

  return payload.data.validators.flatMap((value) => {
    if (typeof value !== "string") {
      return [];
    }
    const address = normalizeValidatorAddress(value);
    return address ? [address] : [];
  });
}

function parseStorageLocations(payload: unknown): ReadonlyMap<string, readonly string[]> {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.storage_locations)) {
    throw new Error("Validator Announce returned invalid storage locations.");
  }

  const locations = new Map<string, readonly string[]>();
  payload.data.storage_locations.forEach((entry) => {
    if (!Array.isArray(entry) || typeof entry[0] !== "string" || !Array.isArray(entry[1])) {
      return;
    }
    const address = normalizeValidatorAddress(entry[0]);
    const validatorLocations = entry[1].filter((value): value is string => typeof value === "string");
    if (address) {
      locations.set(address, validatorLocations);
    }
  });
  return locations;
}

function parseMerkleTreeCount(payload: unknown): number | undefined {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return undefined;
  }
  const count = payload.data.count;
  return typeof count === "number" && Number.isSafeInteger(count) && count >= 0 ? count : undefined;
}

async function loadTerraValidatorState(): Promise<TerraValidatorState> {
  const announcedPayload = await queryTerraContract(
    hyperlaneNetworkConfiguration.source.contracts.validatorAnnounce,
    { get_announced_validators: {} },
  );
  const validators = parseAnnouncedValidators(announcedPayload);

  const [locationsPayload, merklePayload] = await Promise.all([
    queryTerraContract(
      hyperlaneNetworkConfiguration.source.contracts.validatorAnnounce,
      { get_announce_storage_locations: { validators: validators.map((address) => address.slice(2)) } },
    ),
    queryTerraContract(hyperlaneNetworkConfiguration.source.contracts.merkleTreeHook, { merkle_hook: { count: {} } }),
  ]);

  return {
    validators,
    storageLocations: parseStorageLocations(locationsPayload),
    merkleTreeCount: parseMerkleTreeCount(merklePayload),
  };
}

async function callJsonRpc(endpoint: string, method: string, params: readonly unknown[]): Promise<unknown> {
  const payload = await fetchJson(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  if (!isRecord(payload) || payload.error || !("result" in payload)) {
    throw new Error("RPC returned an invalid response.");
  }
  return payload.result;
}

async function callJsonRpcWithFallback(
  endpoints: readonly string[],
  method: string,
  params: readonly unknown[],
): Promise<unknown> {
  let lastError: unknown;
  for (const endpoint of endpoints) {
    try {
      return await callJsonRpc(endpoint, method, params);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Every RPC endpoint failed.");
}

function parseEvmValidatorsAndThreshold(value: unknown): { readonly validators: readonly string[]; readonly threshold: number } {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) {
    throw new Error("The EVM ISM returned invalid ABI data.");
  }

  const data = value.slice(2);
  if (data.length < 192) {
    throw new Error("The EVM ISM response was too short.");
  }
  const arrayOffset = Number.parseInt(data.slice(0, 64), 16) * 2;
  const threshold = Number.parseInt(data.slice(64, 128), 16);
  const validatorCount = Number.parseInt(data.slice(arrayOffset, arrayOffset + 64), 16);
  const validatorStart = arrayOffset + 64;

  if (!Number.isSafeInteger(threshold) || !Number.isSafeInteger(validatorCount) || validatorCount < 1 || threshold < 1 || threshold > validatorCount) {
    throw new Error("The EVM ISM returned an invalid threshold.");
  }
  if (validatorStart + validatorCount * 64 > data.length) {
    throw new Error("The EVM ISM validator array was truncated.");
  }

  const validators = Array.from({ length: validatorCount }, (_, index) => {
    const word = data.slice(validatorStart + index * 64, validatorStart + (index + 1) * 64);
    return normalizeValidatorAddress(word.slice(-40));
  });
  if (validators.some((address) => !address)) {
    throw new Error("The EVM ISM returned an invalid validator address.");
  }

  return { validators: validators as readonly string[], threshold };
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function parseSolanaValidatorSet(value: unknown): { readonly validators: readonly string[]; readonly threshold: number } {
  if (!isRecord(value) || !Array.isArray(value.data) || typeof value.data[0] !== "string") {
    throw new Error("The Solana ISM returned invalid account data.");
  }
  const bytes = decodeBase64(value.data[0]);
  if (bytes.length < 7 || bytes[0] !== 1) {
    throw new Error("The Solana ISM validator account is not initialized.");
  }

  const validatorCount = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(2, true);
  const validatorsStart = 6;
  const thresholdOffset = validatorsStart + validatorCount * 20;
  if (validatorCount < 1 || thresholdOffset >= bytes.length) {
    throw new Error("The Solana ISM validator account was truncated.");
  }
  const threshold = bytes[thresholdOffset] ?? 0;
  if (threshold < 1 || threshold > validatorCount) {
    throw new Error("The Solana ISM returned an invalid threshold.");
  }

  const validators = Array.from({ length: validatorCount }, (_, index) => {
    const start = validatorsStart + index * 20;
    return `0x${Array.from(bytes.slice(start, start + 20), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  });
  return { validators, threshold };
}

async function loadRouteSnapshot(config: HyperlaneDestinationConfiguration): Promise<HyperlaneRouteSnapshot> {
  try {
    const result = config.protocol === "evm"
      ? parseEvmValidatorsAndThreshold(await callJsonRpcWithFallback(
        config.rpcEndpoints,
        "eth_call",
        [{ to: config.ismAddress, data: VALIDATORS_AND_THRESHOLD_CALL_DATA }, "latest"],
      ))
      : parseSolanaValidatorSet(await callJsonRpcWithFallback(
        config.rpcEndpoints,
        "getAccountInfo",
        [config.validatorSetAccount, { encoding: "base64", commitment: "confirmed" }],
      ).then((response) => isRecord(response) ? response.value : undefined));

    return {
      id: config.id,
      label: config.name,
      ismAddress: config.ismAddress,
      explorerUrl: config.ismExplorerUrl,
      status: "ready",
      threshold: result.threshold,
      validators: result.validators,
    };
  } catch (error) {
    console.warn(`Unable to query the ${config.name} Hyperlane ISM`, error);
    return {
      id: config.id,
      label: config.name,
      ismAddress: config.ismAddress,
      explorerUrl: config.ismExplorerUrl,
      status: "unavailable",
      validators: [],
    };
  }
}

function checkpointUrlFromStorageLocation(location: string): string | undefined {
  if (!location.startsWith("s3://")) {
    return undefined;
  }
  const [bucket, region, ...prefixParts] = location.slice(5).split("/").filter(Boolean);
  if (!bucket || !region || !S3_BUCKET_PATTERN.test(bucket) || !S3_REGION_PATTERN.test(region)) {
    return undefined;
  }
  const prefix = prefixParts.length > 0
    ? `${prefixParts.map((part) => encodeURIComponent(part)).join("/")}/`
    : "";
  return `https://${bucket}.s3.${region}.amazonaws.com/${prefix}checkpoint_latest_index.json`;
}

async function loadCheckpointState(locations: readonly string[]): Promise<CheckpointState> {
  const results = await Promise.all(locations.map(async (location): Promise<CheckpointState> => {
    const url = checkpointUrlFromStorageLocation(location);
    if (!url) {
      return {};
    }
    try {
      const response = await fetchWithTimeout(url, { headers: { Accept: "application/json" } });
      if (!response.ok) {
        return {};
      }
      const rawIndex = (await response.text()).trim().replace(/^"|"$/g, "");
      const index = Number(rawIndex);
      return Number.isSafeInteger(index) && index >= 0
        ? { index, updatedAt: response.headers.get("last-modified") ?? undefined }
        : {};
    } catch {
      return {};
    }
  }));

  return results.reduce<CheckpointState>((latest, candidate) => (
    (candidate.index ?? -1) > (latest.index ?? -1) ? candidate : latest
  ), {});
}

export async function loadHyperlaneValidatorSnapshot(): Promise<HyperlaneSecuritySnapshot> {
  const [terraResult, routes] = await Promise.all([
    loadTerraValidatorState().then(
      (data) => ({ status: "ready" as const, data }),
      (error) => {
        console.warn("Unable to query Terra Classic Hyperlane validator state", error);
        return { status: "unavailable" as const, data: undefined };
      },
    ),
    Promise.all(hyperlaneNetworkConfiguration.destinations.map(loadRouteSnapshot)),
  ]);

  const terraState = terraResult.data;
  const latestCheckpointIndex = terraState?.merkleTreeCount && terraState.merkleTreeCount > 0
    ? terraState.merkleTreeCount - 1
    : undefined;
  const checkpointStates = new Map<string, CheckpointState>();

  if (terraState) {
    await Promise.all(terraState.validators.map(async (address) => {
      checkpointStates.set(address, await loadCheckpointState(terraState.storageLocations.get(address) ?? []));
    }));
  }

  const addresses = new Set<string>(terraState?.validators ?? []);
  routes.forEach((route) => route.validators.forEach((address) => addresses.add(address)));

  const validators = Array.from(addresses, (address): HyperlaneValidatorSnapshot => {
    const metadata = validatorMetadataByAddress.get(address);
    const checkpoint = checkpointStates.get(address);
    const validatorRoutes = routes
      .filter((route) => route.validators.includes(address))
      .map((route) => route.id);

    return {
      address,
      name: metadata?.name ?? "Unidentified validator",
      metadataKnown: Boolean(metadata),
      website: normalizeWebsite(metadata?.website),
      announced: terraState?.validators.includes(address) ?? false,
      checkpointIndex: checkpoint?.index,
      checkpointUpdatedAt: checkpoint?.updatedAt,
      checkpointCurrent: latestCheckpointIndex === undefined || checkpoint?.index === undefined
        ? undefined
        : checkpoint.index >= latestCheckpointIndex,
      routes: validatorRoutes,
    };
  }).sort((left, right) => {
    if (left.routes.length !== right.routes.length) {
      return right.routes.length - left.routes.length;
    }
    if (left.metadataKnown !== right.metadataKnown) {
      return left.metadataKnown ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });

  const availableRoutes = routes.filter((route) => route.status === "ready");
  const sharedThreshold = availableRoutes.length > 0 && availableRoutes.every((route) => route.threshold === availableRoutes[0]?.threshold)
    ? availableRoutes[0]?.threshold
    : undefined;
  const sharedValidatorCount = availableRoutes.length > 0 && availableRoutes.every((route) => route.validators.length === availableRoutes[0]?.validators.length)
    ? availableRoutes[0]?.validators.length
    : undefined;

  return {
    fetchedAt: new Date().toISOString(),
    merkleTreeCount: terraState?.merkleTreeCount,
    latestCheckpointIndex,
    validatorAnnounceStatus: terraResult.status,
    routes,
    validators,
    summary: {
      announcedValidatorCount: terraState?.validators.length ?? 0,
      currentCheckpointCount: validators.filter((validator) => validator.checkpointCurrent).length,
      securingValidatorCount: validators.filter((validator) => validator.routes.length > 0).length,
      availableRouteCount: availableRoutes.length,
      totalRouteCount: routes.length,
      sharedThreshold,
      sharedValidatorCount,
    },
  };
}
