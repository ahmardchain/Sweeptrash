import { readFile } from "node:fs/promises";
import path from "node:path";
import { network } from "hardhat";
import {
  EXPLORER_BASE_URL,
  POOL_FEE_TIER,
  QUOTER_V2_ADDRESS,
  SWAP_ROUTER_02_ADDRESS,
  WMON_ADDRESS,
  explorerTxUrl,
} from "../config/addresses.js";
import { ERC20_ABI } from "../abis/erc20.js";
import { QUOTER_V2_ABI, SWAP_ROUTER_02_ABI } from "../abis/uniswapV3.js";

const { ethers } = await network.connect();

// This is the single most important script in the build: one real
// exactInputSingle swap of a dust token into WMON, on-chain, on Monad
// Testnet. Do not treat a failure here as something to work around.

// Swaps half of deploy.ts's INITIAL_SUPPLY (2), leaving the rest of this
// token's dust in the wallet for the frontend "Sweep All" demo afterward.
const SWAP_AMOUNT = ethers.parseEther("1");
const SLIPPAGE_BPS = 1000n; // 10% — generous, this is thin testnet liquidity, not a price-sensitive trade.

interface DeployedToken {
  address: string;
  name: string;
  symbol: string;
}

async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`Signer: ${signer.address}`);
  console.log(`Explorer: ${EXPLORER_BASE_URL}`);

  const tokensPath = path.join(process.cwd(), "deployed-tokens.json");
  const tokens: Record<string, DeployedToken> = JSON.parse(
    await readFile(tokensPath, "utf-8"),
  );
  const [token] = Object.values(tokens);
  if (!token) {
    throw new Error(`No tokens found in ${tokensPath}. Run the deploy script first.`);
  }

  console.log(`\nSwapping ${ethers.formatEther(SWAP_AMOUNT)} ${token.symbol} -> WMON`);

  const dustToken = new ethers.Contract(token.address, ERC20_ABI, signer);
  const balance: bigint = await dustToken.balanceOf(signer.address);
  if (balance < SWAP_AMOUNT) {
    throw new Error(
      `Signer only holds ${ethers.formatEther(balance)} ${token.symbol}, ` +
        `need ${ethers.formatEther(SWAP_AMOUNT)}. Run the deploy script first.`,
    );
  }

  console.log("Approving SwapRouter02...");
  const approveTx = await dustToken.approve(SWAP_ROUTER_02_ADDRESS, SWAP_AMOUNT);
  await approveTx.wait();
  console.log(`  tx: ${explorerTxUrl(approveTx.hash)}`);

  const quoter = new ethers.Contract(QUOTER_V2_ADDRESS, QUOTER_V2_ABI, signer);
  const [quotedAmountOut] = await quoter.quoteExactInputSingle.staticCall({
    tokenIn: token.address,
    tokenOut: WMON_ADDRESS,
    amountIn: SWAP_AMOUNT,
    fee: POOL_FEE_TIER,
    sqrtPriceLimitX96: 0n,
  });
  const amountOutMinimum =
    (quotedAmountOut * (10_000n - SLIPPAGE_BPS)) / 10_000n;
  console.log(
    `Quote: ${ethers.formatEther(quotedAmountOut)} WMON expected, ` +
      `min accepted ${ethers.formatEther(amountOutMinimum)} WMON`,
  );

  const swapRouter = new ethers.Contract(
    SWAP_ROUTER_02_ADDRESS,
    SWAP_ROUTER_02_ABI,
    signer,
  );

  console.log("Sending swap transaction...");
  const swapTx = await swapRouter.exactInputSingle({
    tokenIn: token.address,
    tokenOut: WMON_ADDRESS,
    fee: POOL_FEE_TIER,
    recipient: signer.address,
    amountIn: SWAP_AMOUNT,
    amountOutMinimum,
    sqrtPriceLimitX96: 0n,
  });
  console.log(`  submitted, tx hash: ${swapTx.hash}`);
  console.log(`  pending: ${explorerTxUrl(swapTx.hash)}`);

  const receipt = await swapTx.wait();
  console.log(
    `\nConfirmed in block ${receipt?.blockNumber}. ` +
      `Verify independently at: ${explorerTxUrl(swapTx.hash)}`,
  );
}

main().catch((error: unknown) => {
  console.error("\nSwap test FAILED — this is the de-risking checkpoint, do not proceed to Part 2:");
  console.error(error);
  process.exitCode = 1;
});
