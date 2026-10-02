import type {
  AdministrationConfig,
  GovernanceAction,
} from "../types/hyperlane-governance";
import {
  safeAddress,
  squads,
  terraContracts,
} from "../data/hyperlane-governance";

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Unexpected source response.");
  return value as Record<string, unknown>;
}
export function list(value: unknown): unknown[] {
  if (!Array.isArray(value))
    throw new Error("Expected a list from the source.");
  return value;
}
export function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
export function integer(value: unknown): number {
  if ((typeof value !== "string" && typeof value !== "number") || value === "")
    throw new Error("Invalid integer.");
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error("Invalid integer.");
  return n;
}
export function parseSafeConfig(value: unknown): AdministrationConfig {
  const v = record(value);
  if (str(v.address)?.toLowerCase() !== safeAddress.toLowerCase())
    throw new Error("Safe address mismatch.");
  const members = list(v.owners).map((owner) => {
    if (typeof owner !== "string" || !/^0x[0-9a-f]{40}$/i.test(owner))
      throw new Error("Invalid Safe owner.");
    return owner;
  });
  const threshold = integer(v.threshold);
  if (threshold < 1 || threshold > members.length)
    throw new Error("Invalid Safe threshold.");
  return {
    address: safeAddress,
    kind: "Safe multisig",
    members,
    threshold,
    nonce: integer(v.nonce),
  };
}

export function parseSafeAction(
  value: unknown,
  config: AdministrationConfig | undefined,
  prefix: string,
  explorer: string,
): GovernanceAction {
  const v = record(value);
  const hash = str(v.safeTxHash);
  if (
    !hash ||
    !/^0x[0-9a-f]{64}$/i.test(hash) ||
    typeof v.isExecuted !== "boolean"
  )
    throw new Error("Invalid Safe transaction.");
  const nonce = integer(v.nonce);
  const signers = [
    ...new Map(
      list(v.confirmations)
        .map((entry) => str(record(entry).owner))
        .filter((s): s is string => !!s)
        .map((s) => [s.toLowerCase(), s]),
    ).values(),
  ];
  const executed = v.isExecuted;
  const eligible = executed
    ? signers
    : config?.members
      ? signers.filter((s) =>
          config.members?.some(
            (owner) => owner.toLowerCase() === s.toLowerCase(),
          ),
        )
      : [];
  const threshold = executed
    ? integer(v.confirmationsRequired)
    : config?.threshold;
  const consumed =
    !executed && config?.nonce !== undefined && nonce < config.nonce;
  const quorum = threshold !== undefined && eligible.length >= threshold;
  let status = executed
    ? v.isSuccessful === true
      ? "Executed"
      : v.isSuccessful === false
        ? "Execution failed"
        : "Execution result unknown"
    : consumed
      ? "Nonce already used"
      : config
        ? quorum
          ? "Quorum recorded"
          : "Awaiting confirmations"
        : "Configuration unavailable";
  if (
    !executed &&
    !consumed &&
    config?.nonce !== undefined &&
    nonce > config.nonce
  )
    status += " · earlier nonce first";
  const decoded =
    v.dataDecoded && typeof v.dataDecoded === "object"
      ? record(v.dataDecoded)
      : undefined;
  const method = str(decoded?.method);
  const txHash = str(v.transactionHash);
  return {
    id: hash,
    title: method ? `${method}()` : "Contract interaction",
    status,
    active: !executed && !consumed,
    url:
      txHash && /^0x[0-9a-f]{64}$/i.test(txHash)
        ? `${explorer}/tx/${txHash}`
        : `https://app.safe.global/transactions/tx?safe=${prefix}:${safeAddress}&id=multisig_${safeAddress}_${hash}`,
    nonce,
    timestamp: str(v.executionDate) ?? str(v.submissionDate),
    confirmations: config || executed ? eligible.length : undefined,
    threshold,
    signers,
    detail: `To ${str(v.to) ?? "unknown"} · ${str(v.value) ?? "unknown"} wei · ${v.operation === 0 ? "CALL" : v.operation === 1 ? "DELEGATECALL" : "unknown operation"}. Recorded confirmations are not a guarantee of successful execution.`,
    payload: {
      to: v.to,
      value: v.value,
      operation: v.operation,
      data: v.data,
      decoded: decoded ?? null,
    },
  };
}

// Match actual message contract fields, including nested governance execution messages.
// Mentioning Hyperlane or an address in a title/summary is not sufficient.
export function matchesTerraContracts(messages: unknown): boolean {
  if (Array.isArray(messages)) return messages.some(matchesTerraContracts);
  if (!messages || typeof messages !== "object") return false;
  const v = record(messages);
  if (
    typeof v.contract === "string" &&
    terraContracts.some((c) => c.address === v.contract)
  )
    return true;
  return [v.messages, v.content, v.msgs].some(
    (child) => child && matchesTerraContracts(child),
  );
}
export function parseTerraAction(value: unknown): GovernanceAction {
  const v = record(value);
  const id = String(integer(v.id));
  const statuses: Record<string, string> = {
    PROPOSAL_STATUS_DEPOSIT_PERIOD: "Deposit period",
    PROPOSAL_STATUS_VOTING_PERIOD: "Voting",
    PROPOSAL_STATUS_PASSED: "Passed",
    PROPOSAL_STATUS_REJECTED: "Rejected",
    PROPOSAL_STATUS_FAILED: "Failed",
  };
  const status = statuses[String(v.status)] ?? "Unknown proposal status";
  return {
    id,
    title: `#${id} · ${str(v.title) ?? "Hyperlane contract proposal"}`,
    status,
    active: status === "Voting" || status === "Deposit period",
    url: `https://www.validator.info/terra-classic/governance/${id}`,
    timestamp: str(v.submit_time),
    deadline:
      status === "Voting"
        ? str(v.voting_end_time)
        : status === "Deposit period"
          ? str(v.deposit_end_time)
          : undefined,
    detail:
      str(v.summary) ??
      "Contains messages targeting a contract in the Hyperlane inventory.",
    payload: v.messages,
  };
}

const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function base58(bytes: Uint8Array): string {
  let n = 0n;
  for (const byte of bytes) n = n * 256n + BigInt(byte);
  let output = "";
  while (n > 0n) {
    output = alphabet[Number(n % 58n)] + output;
    n /= 58n;
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    output = "1" + output;
  }
  return output;
}
export function accountBytes(value: unknown): Uint8Array {
  const v = record(value);
  const data = list(v.data);
  if (data[1] !== "base64" || typeof data[0] !== "string")
    throw new Error("Unexpected Solana encoding.");
  return Uint8Array.from(atob(data[0]), (char) => char.charCodeAt(0));
}
// Read-only Borsh layouts from Squads v4 SDK IDL. Check owner and discriminator
// before decoding; never interpret an unknown account version as an empty list.
// https://github.com/Squads-Protocol/v4/blob/main/sdk/multisig/idl/squads_multisig_program.json
class Reader {
  offset = 0;
  constructor(readonly bytes: Uint8Array) {}
  take(size: number) {
    if (this.offset + size > this.bytes.length || size < 0)
      throw new Error("Truncated Squads account.");
    const value = this.bytes.slice(this.offset, this.offset + size);
    this.offset += size;
    return value;
  }
  number(size: number) {
    let n = 0n;
    const bytes = this.take(size);
    for (let i = size - 1; i >= 0; i--) n = n * 256n + BigInt(bytes[i]);
    if (n > BigInt(Number.MAX_SAFE_INTEGER))
      throw new Error("Account integer exceeds safe range.");
    return Number(n);
  }
  key() {
    return base58(this.take(32));
  }
  keys() {
    const count = this.number(4);
    if (count > 1000) throw new Error("Unexpected member count.");
    return Array.from({ length: count }, () => this.key());
  }
}
export const proposalDiscriminator = [26, 94, 189, 187, 116, 136, 53, 33];
function reader(value: unknown, discriminator: number[]): Reader {
  if (record(value).owner !== squads.program)
    throw new Error("Unexpected Squads program owner.");
  const r = new Reader(accountBytes(value));
  if (r.take(8).some((byte, i) => byte !== discriminator[i]))
    throw new Error("Unexpected Squads account type.");
  return r;
}
export function parseSquadsConfig(
  value: unknown,
): AdministrationConfig & {
  transactionIndex: number;
  staleTransactionIndex: number;
} {
  const r = reader(value, [224, 116, 121, 186, 68, 161, 79, 236]);
  r.key();
  const configAuthority = r.key();
  const threshold = r.number(2);
  const timeLock = r.number(4);
  const transactionIndex = r.number(8);
  const staleTransactionIndex = r.number(8);
  const option = r.number(1);
  if (option > 1) throw new Error("Invalid optional rent collector.");
  if (option) r.key();
  r.number(1);
  const count = r.number(4);
  if (count > 1000) throw new Error("Invalid member count.");
  const members: string[] = [];
  let voters = 0;
  for (let i = 0; i < count; i++) {
    members.push(r.key());
    if (r.number(1) & 2) voters++;
  }
  if (threshold < 1 || threshold > voters)
    throw new Error("Invalid voting threshold.");
  return {
    address: squads.multisig,
    kind: "Squads multisig",
    vault: squads.vault,
    threshold,
    members,
    voters,
    timeLock,
    configAuthority,
    transactionIndex,
    staleTransactionIndex,
  };
}
export function parseSquadsProposal(
  value: unknown,
  address: string,
  config: ReturnType<typeof parseSquadsConfig>,
): GovernanceAction {
  const r = reader(value, proposalDiscriminator);
  if (r.key() !== squads.multisig)
    throw new Error("Proposal multisig mismatch.");
  const index = r.number(8);
  const variant = r.number(1);
  const labels = [
    "Draft",
    "Active",
    "Rejected",
    "Approved",
    "Executing",
    "Executed",
    "Cancelled",
  ];
  if (!labels[variant]) throw new Error("Unknown Squads proposal status.");
  const timestamp =
    variant === 4 ? undefined : new Date(r.number(8) * 1000).toISOString();
  r.number(1);
  const approved = r.keys();
  const rejected = r.keys();
  const cancelled = r.keys();
  const stale =
    index <= config.staleTransactionIndex && [0, 1, 3].includes(variant);
  return {
    id: address,
    title: `Squads proposal #${index}`,
    status: stale ? "Stale after configuration change" : labels[variant],
    active: !stale && [0, 1, 3, 4].includes(variant),
    url: `https://solscan.io/account/${address}`,
    timestamp,
    confirmations: approved.length,
    threshold:
      !stale && [0, 1, 3, 4].includes(variant) ? config.threshold : undefined,
    signers: approved,
    detail: `Review the associated transaction instructions in Squads. Current time lock: ${config.timeLock}s. Approval and execution are separate steps.`,
    payload: {
      proposalAccount: address,
      transactionIndex: index,
      approved,
      rejected,
      cancelled,
    },
  };
}
