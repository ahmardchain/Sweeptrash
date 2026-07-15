"use client";

import { formatEther } from "viem";
import { explorerTxUrl } from "@/lib/contracts";
import type { SweepTokenState } from "@/lib/useSweepAll";
import type { DeployedToken } from "@/lib/useDeployedTokens";

export function SweepSummary({
  tokens,
  states,
  finalWmonBalance,
}: {
  tokens: DeployedToken[];
  states: Record<string, SweepTokenState>;
  finalWmonBalance: bigint;
}) {
  const succeeded = tokens.filter((t) => states[t.address]?.status === "confirmed");
  const failed = tokens.filter((t) => states[t.address]?.status === "failed");
  const allTxHashes = tokens.flatMap((t) => {
    const s = states[t.address];
    const hashes: { label: string; hash: `0x${string}` }[] = [];
    if (s?.approveTxHash) hashes.push({ label: `${t.symbol} approve`, hash: s.approveTxHash });
    if (s?.swapTxHash) hashes.push({ label: `${t.symbol} swap`, hash: s.swapTxHash });
    return hashes;
  });

  return (
    <div className="animate-stash-pop-in rounded-2xl border border-stash-mint/30 bg-stash-mint-tint p-6">
      <h3 className="font-display text-lg font-bold text-stash-mint-dark">Sweep complete</h3>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="font-mono text-2xl font-semibold text-stash-ink">{succeeded.length}</p>
          <p className="text-xs text-stash-ink-soft">successful swaps</p>
        </div>
        {failed.length > 0 && (
          <div>
            <p className="font-mono text-2xl font-semibold text-stash-coral">{failed.length}</p>
            <p className="text-xs text-stash-ink-soft">failed</p>
          </div>
        )}
        <div>
          <p className="font-mono text-2xl font-semibold text-stash-ink">
            {Number(formatEther(finalWmonBalance)).toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}
          </p>
          <p className="text-xs text-stash-ink-soft">WMON balance now</p>
        </div>
      </div>

      {allTxHashes.length > 0 && (
        <div className="mt-5 border-t border-stash-mint/20 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stash-ink-soft">
            Every transaction this session
          </p>
          <ul className="space-y-1.5">
            {allTxHashes.map(({ label, hash }) => (
              <li key={hash} className="flex items-center justify-between gap-3 font-mono text-xs">
                <span className="text-stash-ink-soft">{label}</span>
                <a
                  href={explorerTxUrl(hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-stash-mint underline decoration-dotted underline-offset-2 hover:text-stash-mint-dark"
                >
                  {hash}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
