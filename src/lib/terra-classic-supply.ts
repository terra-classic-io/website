export type TerraClassicSupplyCoin = {
  readonly denom: string;
  readonly amount: string;
};

export type TerraClassicSupplyResponse = {
  readonly coins: readonly TerraClassicSupplyCoin[];
  readonly endpoint: string;
};

const LCD_ENDPOINTS = [
  "https://terra-classic-lcd.publicnode.com",
  "https://lcd.terra-classic.hexxagon.io",
  "https://api-lunc-lcd.binodes.com",
] as const;

const FCD_ENDPOINTS = [
  "https://terra-classic-fcd.publicnode.com",
  "https://fcd.terra-classic.hexxagon.io",
] as const;

export type TerraClassicCirculatingSupplyAsset = "luna" | "ust";

export type TerraClassicCirculatingSupplyResponse = {
  readonly amount: number;
  readonly endpoint: string;
};

export const TERRA_CLASSIC_TOTAL_SUPPLY_PATH = "/cosmos/bank/v1beta1/supply?pagination.limit=1000";
const MICRO_UNIT_DECIMALS = 6;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function parseSupply(payload: unknown): readonly TerraClassicSupplyCoin[] {
  if (!isRecord(payload) || !Array.isArray(payload.supply)) {
    throw new Error("The LCD returned an invalid total-supply response.");
  }

  return payload.supply.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    const denom = readString(entry.denom);
    const amount = readString(entry.amount);
    return denom && amount ? [{ denom, amount }] : [];
  });
}

export function microAmountToDisplayNumber(amount?: string): number | undefined {
  if (!amount || !/^\d+$/.test(amount)) {
    return undefined;
  }

  const padded = amount.padStart(MICRO_UNIT_DECIMALS + 1, "0");
  const integerPart = padded.slice(0, -MICRO_UNIT_DECIMALS);
  const fractionPart = padded.slice(-MICRO_UNIT_DECIMALS);
  const value = Number(`${integerPart}.${fractionPart}`);
  return Number.isFinite(value) ? value : undefined;
}

export async function fetchTerraClassicSupply(signal?: AbortSignal): Promise<TerraClassicSupplyResponse> {
  let lastError: unknown;

  for (const endpoint of LCD_ENDPOINTS) {
    if (signal?.aborted) {
      throw new DOMException("The request was aborted.", "AbortError");
    }

    try {
      const response = await fetch(`${endpoint}${TERRA_CLASSIC_TOTAL_SUPPLY_PATH}`, {
        signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`LCD request failed with status ${response.status}.`);
      }
      const payload: unknown = await response.json();
      return { coins: parseSupply(payload), endpoint };
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Every configured LCD endpoint failed.");
}

export async function fetchTerraClassicCirculatingSupply(
  asset: TerraClassicCirculatingSupplyAsset,
  signal?: AbortSignal
): Promise<TerraClassicCirculatingSupplyResponse> {
  let lastError: unknown;

  for (const endpoint of FCD_ENDPOINTS) {
    if (signal?.aborted) {
      throw new DOMException("The request was aborted.", "AbortError");
    }

    try {
      const response = await fetch(`${endpoint}/v1/circulatingsupply/${asset}`, {
        signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`FCD request failed with status ${response.status}.`);
      }

      const amount: unknown = await response.json();
      if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
        throw new Error("FCD returned an invalid circulating-supply value.");
      }

      return { amount, endpoint };
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Every configured FCD endpoint failed.");
}
