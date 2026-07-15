import { readFile } from "node:fs/promises";
import path from "node:path";
import { network } from "hardhat";
import {
  NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  POOL_FEE_TIER,
  WMON_ADDRESS,
} from "../config/addresses.js";
import {
  FULL_RANGE_TICK_LOWER,
  FULL_RANGE_TICK_UPPER,
  ONE_TO_ONE_SQRT_PRICE_X96,
  orderTokens,
} from "../config/uniswap.js";
import { NONFUNGIBLE_POSITION_MANAGER_ABI } from "../abis/uniswapV3.js";
import { WMON_ABI } from "../abis/wmon.js";

const { ethers } = await network.connect();

// Small, testnet-appropriate seed liquidity per pool (cosmetic ~1:1 price,
// not meant to reflect real value). Each of the 3 pools gets this much of
// the dust token (freshly minted by the deployer, who owns DustToken) and
// this much WMON (wrapped from the deployer's real testnet MON balance).
// Kept several times larger than deploy.ts's INITIAL_SUPPLY so a full
// "Sweep All" from the frontend doesn't crater pool price, and small enough
// overall (24 WMON across 3 pools) to be realistic to get from a testnet
// faucet.
const SEED_AMOUNT = ethers.parseEther("8");

interface DeployedToken {
  address: string;
  name: string;
  symbol: string;
}

async function main() {
  const [deployer] = await ethers.getSigners();

  const tokensPath = path.join(process.cwd(), "deployed-tokens.json");
  const tokens: Record<string, DeployedToken> = JSON.parse(
    await readFile(tokensPath, "utf-8"),
  );
  const tokenList = Object.values(tokens);
  if (tokenList.length === 0) {
    throw new Error(
      `No tokens found in ${tokensPath}. Run the deploy script first.`,
    );
  }

  const wmon = new ethers.Contract(WMON_ADDRESS, WMON_ABI, deployer);
  const positionManager = new ethers.Contract(
    NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
    NONFUNGIBLE_POSITION_MANAGER_ABI,
    deployer,
  );

  const totalWmonNeeded = SEED_AMOUNT * BigInt(tokenList.length);
  const currentWmonBalance: bigint = await wmon.balanceOf(deployer.address);
  if (currentWmonBalance < totalWmonNeeded) {
    const toWrap = totalWmonNeeded - currentWmonBalance;
    const nativeBalance = await ethers.provider.getBalance(deployer.address);
    if (nativeBalance < toWrap) {
      throw new Error(
        `Deployer ${deployer.address} has ${ethers.formatEther(nativeBalance)} MON ` +
          `but needs to wrap ${ethers.formatEther(toWrap)} more MON into WMON to seed all pools. ` +
          `Fund this address from the Monad testnet faucet and re-run.`,
      );
    }
    console.log(`Wrapping ${ethers.formatEther(toWrap)} MON into WMON...`);
    const wrapTx = await wmon.deposit({ value: toWrap });
    await wrapTx.wait();
    console.log(`  wrapped, tx: ${wrapTx.hash}`);
  }

  const wmonApproveTx = await wmon.approve(
    NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
    totalWmonNeeded,
  );
  await wmonApproveTx.wait();

  for (const token of tokenList) {
    console.log(`\nSeeding pool for ${token.symbol} (${token.name})...`);

    const dustToken = await ethers.getContractAt("DustToken", token.address, deployer);

    console.log(`  minting ${ethers.formatEther(SEED_AMOUNT)} ${token.symbol} for liquidity...`);
    const mintTx = await dustToken.mint(deployer.address, SEED_AMOUNT);
    await mintTx.wait();

    const approveTx = await dustToken.approve(
      NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
      SEED_AMOUNT,
    );
    await approveTx.wait();

    const { token0, token1 } = orderTokens(token.address, WMON_ADDRESS);

    console.log(`  creating/initializing pool (fee ${POOL_FEE_TIER})...`);
    const createPoolTx = await positionManager.createAndInitializePoolIfNecessary(
      token0,
      token1,
      POOL_FEE_TIER,
      ONE_TO_ONE_SQRT_PRICE_X96,
    );
    await createPoolTx.wait();
    console.log(`    tx: ${createPoolTx.hash}`);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    console.log(`  minting full-range liquidity position...`);
    const mintPositionTx = await positionManager.mint({
      token0,
      token1,
      fee: POOL_FEE_TIER,
      tickLower: FULL_RANGE_TICK_LOWER,
      tickUpper: FULL_RANGE_TICK_UPPER,
      amount0Desired: SEED_AMOUNT,
      amount1Desired: SEED_AMOUNT,
      amount0Min: 0,
      amount1Min: 0,
      recipient: deployer.address,
      deadline,
    });
    const receipt = await mintPositionTx.wait();
    console.log(`    tx: ${mintPositionTx.hash} (block ${receipt?.blockNumber})`);
  }

  console.log("\nAll pools seeded.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
