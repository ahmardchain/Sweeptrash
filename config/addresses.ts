/**
 * SweepStash — network & contract addresses.
 *
 * Every value here was supplied directly by the project owner and
 * independently cross-checked against public sources before use
 * (see PR/commit history for the verification trail). Do not add or
 * change any address in this file by guessing — if a new value is
 * needed, get it from the project owner first.
 */

export const CHAIN_ID = 10143; // Monad Testnet — confirmed via docs.monad.xyz + chainlist.org/chain/10143

export const RPC_URL = "https://testnet-rpc.monad.xyz"; // Monad Testnet public RPC — docs.monad.xyz

export const EXPLORER_BASE_URL = "https://testnet.monadexplorer.com"; // Monad Testnet block explorer

/** Wrapped MON — the sweep target asset. Confirmed on testnet.monadexplorer.com by project owner. */
export const WMON_ADDRESS = "0x760afe86e5de5fa0ee542fc7b7b713e1c5425701";

/**
 * Uniswap V3 core contracts on Monad Testnet.
 * Confirmed as verified/deployed contracts on testnet.monadexplorer.com
 * by the project owner (chain 10143, not to be confused with Monad
 * Mainnet's chain 143, which shares some of the same canonical
 * CREATE2 addresses but is a completely separate deployment).
 */
export const UNISWAP_V3_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
export const SWAP_ROUTER_02_ADDRESS = "0xfe31f71c1b106eac32f1a19239c9a9a72ddfb900";
export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = "0x7197e214c0b767cfb76fb734ab638e2c192f4e53";
export const QUOTER_V2_ADDRESS = "0x661e93cca42afacb172121ef892830ca3b70f08d";

/** Standard Uniswap V3 pool fee tiers, in hundredths of a bip. 3000 = 0.3%. */
export const POOL_FEE_TIER = 3000;

/**
 * Slippage tolerance applied to every swap's amountOutMinimum, computed from
 * a live QuoterV2 quote taken immediately before the swap. Generous by
 * design — testnet pools here are thin and this isn't a price-sensitive
 * trade. Shared by scripts/testSwap.ts and frontend/lib/useSweepAll.ts so
 * the two can't silently drift apart.
 */
export const SLIPPAGE_BPS = 1000n;

export function explorerTxUrl(txHash: string): string {
  return `${EXPLORER_BASE_URL}/tx/${txHash}`;
}
