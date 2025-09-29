/**
 * @fileoverview Utility helpers for deterministic seeded randomization.
 */

export type SeededRandomFn = () => number;

const FNV_OFFSET_BASIS: number = 2166136261;
const FNV_PRIME: number = 16777619;

const normalizeSeed = (seed: number): number => (seed >>> 0);

export const stringToSeed = (input: string): number => {
  let hash: number = normalizeSeed(FNV_OFFSET_BASIS);
  for (let index: number = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return normalizeSeed(hash);
};

export const createMulberry32 = (seed: number): SeededRandomFn => {
  let state: number = normalizeSeed(seed);
  return () => {
    state = normalizeSeed(state + 0x6D2B79F5);
    let temp: number = Math.imul(state ^ (state >>> 15), 1 | state);
    temp ^= temp + Math.imul(temp ^ (temp >>> 7), 61 | temp);
    return normalizeSeed(temp ^ (temp >>> 14)) / 4294967296;
  };
};

export const shuffleWithSeed = <T>(items: readonly T[], seedKey: string): T[] => {
  const rng: SeededRandomFn = createMulberry32(stringToSeed(seedKey));
  const result: T[] = [...items];
  for (let index: number = result.length - 1; index > 0; index -= 1) {
    const randomIndex: number = Math.floor(rng() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
};

export const getOrCreateDailySeed = (key: string): string => {
  if (typeof window === 'undefined') {
    const today = new Date();
    return `${key}-${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`;
  }
  const today: Date = new Date();
  const dateKey: string = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`;
  const storageKey: string = `${key}-daily-seed`;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as { date: string; seed: string };
      if (parsed.date === dateKey && parsed.seed) {
        return parsed.seed;
      }
    }
  } catch (error) {
    // Ignore JSON or storage errors and generate a fresh seed.
  }
  const newSeed: string = Math.random().toString(36).slice(2, 12);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ date: dateKey, seed: newSeed }));
  } catch (error) {
    // Swallow storage errors, still return the new seed.
  }
  return newSeed;
};
