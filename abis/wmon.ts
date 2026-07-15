import { ERC20_ABI } from "./erc20.js";

/** WMON follows the standard WETH9-style wrapped-native interface: plain ERC20 plus deposit/withdraw. */
export const WMON_ABI = [
  ...ERC20_ABI,
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "wad", type: "uint256" }],
    outputs: [],
  },
] as const;
