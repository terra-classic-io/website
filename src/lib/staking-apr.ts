export const STAKING_APR_SOURCE = "https://www.terra-classic.tech/api/terra/validators";

type OracleDripPayload = {
  readonly aprValue?: unknown;
  readonly meta?: {
    readonly apr?: {
      readonly method?: unknown;
      readonly isReal?: unknown;
    };
  };
};

export const readOracleDripApr = (payload: unknown): number | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const data = payload as OracleDripPayload;
  const apr = data.meta?.apr;
  if (apr?.method !== "annualized-oracle-drip" || apr.isReal !== true) {
    return null;
  }
  if (typeof data.aprValue !== "number" || !Number.isFinite(data.aprValue) || data.aprValue < 0) {
    return null;
  }
  return data.aprValue;
};
