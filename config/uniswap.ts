import { POOL_FEE_TIER } from "./addresses.js";

/**
 * Uniswap V3 protocol constants (tick math), not chain-specific — these are
 * fixed properties of the Uniswap V3 protocol itself, not addresses.
 */

/** Uniswap V3's global tick bounds are ±887272. */
const MIN_TICK = -887272;
const MAX_TICK = 887272;

/** Fixed protocol mapping from fee tier (hundredths of a bip) to tick spacing. */
const TICK_SPACING_BY_FEE_TIER: Record<number, number> = {
  500: 10,
  3000: 60,
  10000: 200,
};

function tickSpacingForFeeTier(feeTier: number): number {
  const spacing = TICK_SPACING_BY_FEE_TIER[feeTier];
  if (spacing === undefined) {
    throw new Error(
      `No known Uniswap V3 tick spacing for fee tier ${feeTier}. ` +
        `Add it to TICK_SPACING_BY_FEE_TIER in config/uniswap.ts.`,
    );
  }
  return spacing;
}

const TICK_SPACING = tickSpacingForFeeTier(POOL_FEE_TIER);

/** Widest usable tick range for POOL_FEE_TIER, aligned to its tick spacing. */
export const FULL_RANGE_TICK_LOWER = Math.ceil(MIN_TICK / TICK_SPACING) * TICK_SPACING;
export const FULL_RANGE_TICK_UPPER = Math.floor(MAX_TICK / TICK_SPACING) * TICK_SPACING;

/** sqrtPriceX96 for a nominal 1:1 starting price: sqrt(1) * 2^96. */
export const ONE_TO_ONE_SQRT_PRICE_X96 = 2n ** 96n;

/** Uniswap V3 pools always order the pair as token0 < token1 by address. */
export function orderTokens(
  tokenA: string,
  tokenB: string,
): { token0: string; token1: string } {
  return BigInt(tokenA) < BigInt(tokenB)
    ? { token0: tokenA, token1: tokenB }
    : { token0: tokenB, token1: tokenA };
}
