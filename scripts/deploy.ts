import { writeFile } from "node:fs/promises";
import path from "node:path";
import { network } from "hardhat";
import type { DeployedToken } from "../config/deployedTokens.js";

const { ethers } = await network.connect();

interface DustTokenSpec {
  name: string;
  symbol: string;
}

// Distinct, slightly relatable "dust" tokens for the demo.
const DUST_TOKENS: DustTokenSpec[] = [
  { name: "RandomAirdrop", symbol: "RAD" },
  { name: "ForgottenLPReward", symbol: "FLP" },
  { name: "TestnetJunk", symbol: "JUNK" },
];

// Small demo balance minted straight to the deployer's wallet — this is
// what shows up as "dust" to sweep in the frontend. Kept small on purpose:
// it must stay well within what scripts/seedPools.ts seeds as pool
// liquidity (SEED_AMOUNT), and testnet MON from faucets is scarce.
const INITIAL_SUPPLY = ethers.parseEther("2");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying DustTokens from ${deployer.address}`);

  const deployed: Record<string, DeployedToken> = {};

  for (const token of DUST_TOKENS) {
    const factory = await ethers.getContractFactory("DustToken");
    const contract = await factory.deploy(
      token.name,
      token.symbol,
      INITIAL_SUPPLY,
      deployer.address,
    );
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`  ${token.symbol.padEnd(6)} (${token.name}) -> ${address}`);
    deployed[token.symbol] = { address, name: token.name, symbol: token.symbol };
  }

  const outPath = path.join(process.cwd(), "deployed-tokens.json");
  await writeFile(outPath, JSON.stringify(deployed, null, 2) + "\n");
  console.log(`\nSaved addresses to ${outPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
