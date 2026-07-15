"use client";

import { formatEther } from "viem";
import { explorerTxUrl } from "@/lib/contracts";
import type { SweepStatus, SweepTokenState } from "@/lib/useSweepAll";
import type { DeployedToken } from "@/lib/useDeployedTokens";

const STATUS_LABEL: Record<SweepStatus, string> = {
  waiting: "Queued",
  approving: "Approving…",
  quoting: "Getting quote…",
  swapping: "Swapping…",
  confirmed: "Swept",
  failed: "Failed",
};

function StatusBadge({ status }: { status: SweepStatus | "idle" }) {
  if (status === "idle") return null;
  if (status === "confirmed") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-stash-mint-tint px-2.5 py-1 text-xs font-semibold text-stash-mint-dark">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
          <path
            d="M3 8.5 6.5 12 13 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Swept
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="rounded-full bg-stash-coral-tint px-2.5 py-1 text-xs font-semibold text-stash-coral">
        Failed
      </span>
    );
  }
  if (status === "waiting") {
    return (
      <span className="rounded-full bg-stash-paper-dim px-2.5 py-1 text-xs font-semibold text-stash-ink-soft">
        Queued
      </span>
    );
  }
  return (
    <span className="animate-stash-shimmer flex items-center gap-1.5 rounded-full bg-stash-dust-tint px-2.5 py-1 text-xs font-semibold text-stash-dust-dark">
      <span className="h-2 w-2 animate-pulse rounded-full bg-stash-dust" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function TokenDustCard({
  token,
  balance,
  state,
}: {
  token: DeployedToken;
  balance: bigint;
  state?: SweepTokenState;
}) {
  const status = state?.status ?? "idle";
  const isConfirmed = status === "confirmed";

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-stash-border bg-stash-card px-5 py-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold transition-colors duration-500 ${
            isConfirmed
              ? "bg-stash-mint-tint text-stash-mint-dark"
              : "bg-stash-dust-tint text-stash-dust-dark"
          }`}
        >
          {token.symbol.slice(0, 2)}
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-stash-ink">{token.symbol}</p>
          <p className="text-xs text-stash-ink-soft">{token.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-mono text-sm font-medium text-stash-ink">
            {Number(formatEther(balance)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </p>
          {state?.swapTxHash && (
            <a
              href={explorerTxUrl(state.swapTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-stash-mint underline decoration-dotted underline-offset-2 hover:text-stash-mint-dark"
            >
              {state.swapTxHash.slice(0, 10)}…{state.swapTxHash.slice(-6)}
            </a>
          )}
          {state?.status === "failed" && state.errorMessage && (
            <p className="max-w-[220px] truncate text-[11px] text-stash-coral" title={state.errorMessage}>
              {state.errorMessage}
            </p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}
