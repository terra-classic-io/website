export type HyperlaneRouteId = "bsc" | "ethereum" | "solana";

export type HyperlaneValidatorProfile = {
  readonly name: string;
  readonly address: string;
  readonly website?: string;
};

type HyperlaneEvmDestinationConfiguration = {
  readonly id: Extract<HyperlaneRouteId, "bsc" | "ethereum">;
  readonly name: string;
  readonly protocol: "evm";
  readonly domain: number;
  readonly rpcEndpoints: readonly string[];
  readonly ismAddress: string;
  readonly ismExplorerUrl: string;
};

type HyperlaneSolanaDestinationConfiguration = {
  readonly id: Extract<HyperlaneRouteId, "solana">;
  readonly name: string;
  readonly protocol: "solana";
  readonly domain: number;
  readonly rpcEndpoints: readonly string[];
  readonly ismAddress: string;
  readonly validatorSetAccount: string;
  readonly ismExplorerUrl: string;
};

export type HyperlaneDestinationConfiguration =
  | HyperlaneEvmDestinationConfiguration
  | HyperlaneSolanaDestinationConfiguration;

export type HyperlaneNetworkConfiguration = {
  readonly source: {
    readonly id: "terraclassic";
    readonly name: string;
    readonly domain: number;
    readonly contracts: {
      readonly validatorAnnounce: string;
      readonly merkleTreeHook: string;
    };
  };
  readonly destinations: readonly HyperlaneDestinationConfiguration[];
};

export type HyperlaneRouteSnapshot = {
  readonly id: HyperlaneRouteId;
  readonly label: string;
  readonly ismAddress: string;
  readonly explorerUrl: string;
  readonly status: "ready" | "unavailable";
  readonly threshold?: number;
  readonly validators: readonly string[];
};

export type HyperlaneValidatorSnapshot = {
  readonly address: string;
  readonly name: string;
  readonly metadataKnown: boolean;
  readonly website?: string;
  readonly announced: boolean | null;
  readonly checkpointIndex?: number;
  readonly checkpointUpdatedAt?: string;
  readonly checkpointCurrent?: boolean;
  readonly routes: readonly HyperlaneRouteId[];
};

export type HyperlaneSecuritySnapshot = {
  readonly fetchedAt: string;
  readonly merkleTreeCount?: number;
  readonly latestCheckpointIndex?: number;
  readonly validatorAnnounceStatus: "ready" | "unavailable";
  readonly routes: readonly HyperlaneRouteSnapshot[];
  readonly validators: readonly HyperlaneValidatorSnapshot[];
  readonly summary: {
    readonly announcedValidatorCount: number | null;
    readonly currentCheckpointCount: number | null;
    readonly securingValidatorCount: number;
    readonly availableRouteCount: number;
    readonly totalRouteCount: number;
    readonly sharedThreshold?: number;
    readonly sharedValidatorCount?: number;
  };
};
