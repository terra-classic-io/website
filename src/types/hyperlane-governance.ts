export type GovernanceNetworkId = "terra" | "bsc" | "ethereum" | "solana";

export type GovernanceSource<T> = {
  url: string;
  checkedAt: string;
  data?: T;
  error?: string;
  limited?: boolean;
};

export type AdministrationConfig = {
  address: string;
  kind: string;
  threshold?: number;
  members?: string[];
  voters?: number;
  nonce?: number;
  vault?: string;
  timeLock?: number;
  configAuthority?: string;
};

export type GovernanceAction = {
  id: string;
  title: string;
  status: string;
  active: boolean;
  url: string;
  timestamp?: string;
  deadline?: string;
  confirmations?: number;
  threshold?: number;
  nonce?: number;
  detail: string;
  payload?: unknown;
  signers?: string[];
  tally?: Record<string, string>;
};

export type ContractAuthority = {
  label: string;
  address: string;
  url: string;
  owner?: string | null;
  pendingOwner?: string | null;
  admin?: string | null;
  adminLabel?: string;
  note?: string;
};

export type GovernanceNetwork = {
  id: GovernanceNetworkId;
  name: string;
  reviewUrl: string;
  configuration: GovernanceSource<AdministrationConfig>;
  pending: GovernanceSource<GovernanceAction[]>;
  history: GovernanceSource<GovernanceAction[]>;
  authorities: GovernanceSource<ContractAuthority[]>;
};

export type HyperlaneGovernanceSnapshot = {
  fetchedAt: string;
  networks: GovernanceNetwork[];
};
