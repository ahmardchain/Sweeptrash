/**
 * Shape of each entry in deployed-tokens.json (written by scripts/deploy.ts).
 * Kept dependency-free (no Node-only imports) so it can be imported by both
 * the Hardhat scripts and the frontend, including client components.
 */
export interface DeployedToken {
  address: string;
  name: string;
  symbol: string;
}
