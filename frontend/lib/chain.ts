import { defineChain } from "viem";
import { CHAIN_ID, EXPLORER_BASE_URL, RPC_URL } from "../../config/addresses";

// Built from config/addresses.ts (the single source of truth for network
// values) rather than any built-in chain list, so there's exactly one place
// to audit or update these values.
export const monadTestnet = defineChain({
  id: CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Testnet MON Token",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Monad Testnet Explorer", url: EXPLORER_BASE_URL },
  },
  testnet: true,
});
