"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { useDeployedTokens } from "@/lib/useDeployedTokens";
import { useDustBalances } from "@/lib/useDustBalances";
import { useSweepAll } from "@/lib/useSweepAll";
import { WMON_ADDRESS } from "@/lib/contracts";
import { buildAllowlist, isTokenAllowed } from "../../config/tokenAllowlist";
import { TokenDustCard } from "./TokenDustCard";
import { SweepSummary } from "./SweepSummary";
import { SweepPile } from "./SweepPile";

// How long a "Swept" row stays visible before it consolidates into the pile.
const DISMISS_DELAY_MS = 1100;

export function DustDashboard() {
  const { address } = useAccount();
  const { tokens, seeded, error: deployedTokensError, isLoading: tokensLoading } = useDeployedTokens();
  const { balances, isLoading: balancesLoading, refetch } = useDustBalances(tokens, address);
  const { phase, states, sweepAll, reset } = useSweepAll();

  const { data: nativeBalance } = useBalance({ address });
  const { data: wmonBalance, refetch: refetchWmon } = useBalance({
    address,
    token: WMON_ADDRESS as `0x${string}`,
  });

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function clearDismissTimers() {
    for (const timer of dismissTimers.current.values()) clearTimeout(timer);
    dismissTimers.current.clear();
  }

  // Clear any in-flight timers on unmount only — this must not re-run when
  // `states` changes, or it would cancel timers we just scheduled below.
  useEffect(() => {
    return () => clearDismissTimers();
  }, []);

  useEffect(() => {
    for (const [tokenAddress, state] of Object.entries(states)) {
      if (state.status === "confirmed" && !dismissTimers.current.has(tokenAddress)) {
        const timer = setTimeout(() => {
          dismissTimers.current.delete(tokenAddress);
          setDismissed((prev) => new Set(prev).add(tokenAddress));
          refetchWmon();
        }, DISMISS_DELAY_MS);
        dismissTimers.current.set(tokenAddress, timer);
      }
    }
  }, [states, refetchWmon]);

  // Only tokens on the verified allowlist are ever shown or swept. Today the
  // allowlist is built from the deploy manifest; a mainnet build that scanned
  // wallets for arbitrary tokens would build it from a trusted token registry
  // instead (see config/tokenAllowlist.ts).
  const allowlist = useMemo(() => buildAllowlist(tokens), [tokens]);
  const allowedBalances = useMemo(
    () => balances.filter((b) => isTokenAllowed(b.token.address, allowlist)),
    [balances, allowlist],
  );
  const hiddenCount = balances.length - allowedBalances.length;

  const dustCount = useMemo(
    () => allowedBalances.filter((b) => b.balance > 0n).length,
    [allowedBalances],
  );
  const hasDust = dustCount > 0;
  const isRunning = phase === "running";
  const isDone = phase === "done";

  async function handleSweep() {
    clearDismissTimers();
    setDismissed(new Set());
    await sweepAll(allowedBalances, allowlist);
    refetch();
    refetchWmon();
  }

  function handleReset() {
    clearDismissTimers();
    reset();
    setDismissed(new Set());
  }

  if (!address) {
    return (
      <div className="animate-stash-pop-in rounded-2xl border border-dashed border-stash-border bg-stash-card px-8 py-16 text-center">
        <p className="font-display text-lg font-medium text-stash-ink-soft">
          Connect a wallet to see your dust.
        </p>
      </div>
    );
  }

  if (deployedTokensError) {
    return (
      <div className="animate-stash-pop-in rounded-2xl border border-stash-coral/40 bg-stash-coral-tint px-8 py-10 text-center">
        <p className="font-display font-semibold text-stash-coral">Couldn&apos;t read deployed-tokens.json</p>
        <p className="mt-2 text-sm text-stash-ink-soft">{deployedTokensError}</p>
      </div>
    );
  }

  if (!seeded && !tokensLoading) {
    return (
      <div className="animate-stash-pop-in rounded-2xl border border-stash-dust/40 bg-stash-dust-tint px-8 py-10 text-center">
        <p className="font-display font-semibold text-stash-dust-dark">
          No dust tokens deployed yet.
        </p>
        <p className="mt-2 text-sm text-stash-ink-soft">
          Run <code className="rounded bg-white/60 px-1.5 py-0.5 font-mono">npm run deploy:tokens</code>{" "}
          from the repo root, then reload this page.
        </p>
      </div>
    );
  }

  const visibleBalances = allowedBalances.filter(
    (b) => !dismissed.has(b.token.address) && (b.balance > 0n || states[b.token.address]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-stretch justify-between gap-4">
        <div className="flex flex-col justify-center">
          <p className="text-sm text-stash-ink-soft">Native balance (sanity check)</p>
          <p className="font-mono text-sm text-stash-ink">
            {nativeBalance ? Number(formatEther(nativeBalance.value)).toFixed(4) : "…"} MON
          </p>
        </div>
        <SweepPile wmonBalance={wmonBalance?.value} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-stash-ink">Your dust</h2>
          <p className="text-sm text-stash-ink-soft">
            {balancesLoading
              ? "Checking balances…"
              : `${dustCount} token${dustCount === 1 ? "" : "s"} with a balance`}
          </p>
          {hiddenCount > 0 && (
            <p className="mt-1 text-xs text-stash-coral">
              {hiddenCount} token{hiddenCount === 1 ? "" : "s"} hidden — not on the verified allowlist.
            </p>
          )}
        </div>
        {!isDone && (
          <button
            type="button"
            onClick={handleSweep}
            disabled={!hasDust || isRunning}
            className="rounded-full bg-stash-mint px-6 py-3 font-display text-sm font-semibold text-white shadow-sm transition hover:bg-stash-mint-dark disabled:cursor-not-allowed disabled:bg-stash-border disabled:text-stash-ink-soft"
          >
            {isRunning ? "Sweeping…" : "Sweep all"}
          </button>
        )}
        {isDone && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-stash-border px-6 py-3 font-display text-sm font-semibold text-stash-ink transition hover:bg-stash-paper-dim"
          >
            Sweep again
          </button>
        )}
      </div>

      {isRunning && (
        <p className="font-mono text-xs text-stash-ink-soft">
          Swapping{" "}
          {Object.values(states).filter((s) => s.status === "confirmed" || s.status === "failed").length +
            1}{" "}
          of {Object.keys(states).length}…
        </p>
      )}

      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {visibleBalances.map(({ token, balance }) => (
            <motion.div
              key={token.address}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.25, y: -70, filter: "blur(6px)" }}
              transition={{ duration: 0.45, ease: [0.55, 0, 0.85, 0.35] }}
            >
              <TokenDustCard token={token} balance={balance} state={states[token.address]} />
            </motion.div>
          ))}
        </AnimatePresence>
        {!balancesLoading && visibleBalances.length === 0 && phase !== "done" && (
          <div className="rounded-2xl border border-dashed border-stash-border px-6 py-10 text-center text-sm text-stash-ink-soft">
            No dust here — every deployed token has a zero balance for this wallet.
          </div>
        )}
      </div>

      {isDone && wmonBalance && (
        <SweepSummary tokens={tokens} states={states} finalWmonBalance={wmonBalance.value} />
      )}
    </div>
  );
}
