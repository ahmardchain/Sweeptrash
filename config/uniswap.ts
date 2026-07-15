/**
 * Uniswap V3 protocol constants (tick math), not chain-specific — these are
 * fixed properties of the Uniswap V3 protocol itself, not addresses.
 */

/** Uniswap V3's global tick bounds are ±887272. Tick spacing for the 0.3% fee tier is 60. */
const TICK_SPACING_FOR_FEE_3000 = 60;
const MIN_TICK = -887272;
const MAX_TICK = 887272;

/** Widest usable tick range for the 0.3% fee tier, aligned to its tick spacing. */
export const FULL_RANGE_TICK_LOWER =
  Math.ceil(MIN_TICK / TICK_SPACING_FOR_FEE_3000) * TICK_SPACING_FOR_FEE_3000;
export const FULL_RANGE_TICK_UPPER =
  Math.floor(MAX_TICK / TICK_SPACING_FOR_FEE_3000) * TICK_SPACING_FOR_FEE_3000;

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
