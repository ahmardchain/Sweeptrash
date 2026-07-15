import type { DeployedToken } from "./deployedTokens.js";

/**
 * Token allowlist gate.
 *
 * SweepStash only ever sweeps tokens that pass `isTokenAllowed`. Today the
 * trusted source is the deploy manifest (deployed-tokens.json) — the tokens
 * this project itself deployed — combined with a strict address-format check.
 * The sweep flow re-checks this gate right before it approves or swaps each
 * token, so the swap path itself can never be driven to touch an address
 * outside the trusted set (defense-in-depth, not just a display filter).
 *
 * A mainnet version that discovered a user's real dust by scanning wallet
 * balances would face hostile airdropped tokens, so it must NOT trust
 * discovered addresses directly. The single change required there is to
 * replace `buildAllowlist`'s source with a fetched, verified token registry
 * (e.g. the Uniswap token list) — every enforcement site keeps calling the
 * same `isTokenAllowed` gate unchanged.
 */

const EVM_ADDRESS_RE = /^0[xX][0-9a-fA-F]{40}$/;

/** Strict EVM address format check — rejects malformed or truncated entries. */
export function isValidTokenAddress(address: string): boolean {
  return EVM_ADDRESS_RE.test(address);
}

function normalize(address: string): string {
  return address.toLowerCase();
}

/**
 * Build the set of trusted, normalized token addresses from the trusted
 * source. Malformed addresses are dropped rather than trusted. (The WMON
 * sweep target is never a dust token, so it is naturally absent from this
 * set — meaning the gate below also refuses any attempt to "sweep" the
 * target into itself.)
 */
export function buildAllowlist(tokens: DeployedToken[]): Set<string> {
  const allowed = new Set<string>();
  for (const token of tokens) {
    if (isValidTokenAddress(token.address)) {
      allowed.add(normalize(token.address));
    }
  }
  return allowed;
}

/** True only if `address` is well-formed AND present in the trusted allowlist. */
export function isTokenAllowed(address: string, allowlist: Set<string>): boolean {
  return isValidTokenAddress(address) && allowlist.has(normalize(address));
}
