import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DeployedToken } from "../../config/deployedTokens.js";

/** Reads deployed-tokens.json (written by scripts/deploy.ts) from the repo root. */
export async function loadDeployedTokens(): Promise<DeployedToken[]> {
  const tokensPath = path.join(process.cwd(), "deployed-tokens.json");

  let raw: string;
  try {
    raw = await readFile(tokensPath, "utf-8");
  } catch {
    throw new Error(`No tokens found in ${tokensPath}. Run the deploy script first.`);
  }

  const tokens: Record<string, DeployedToken> = JSON.parse(raw);
  const tokenList = Object.values(tokens);
  if (tokenList.length === 0) {
    throw new Error(`No tokens found in ${tokensPath}. Run the deploy script first.`);
  }
  return tokenList;
}
