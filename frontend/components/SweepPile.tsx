"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { formatEther } from "viem";

export function SweepPile({ wmonBalance }: { wmonBalance: bigint | undefined }) {
  const [pulseKey, setPulseKey] = useState(0);
  const prevBalance = useRef<bigint | undefined>(undefined);

  useEffect(() => {
    if (
      wmonBalance !== undefined &&
      prevBalance.current !== undefined &&
      wmonBalance > prevBalance.current
    ) {
      setPulseKey((k) => k + 1);
    }
    prevBalance.current = wmonBalance;
  }, [wmonBalance]);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stash-mint/30 bg-stash-mint-tint px-5 py-4">
      <motion.div
        key={pulseKey}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stash-mint text-white"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
          <path
            d="M4 12h16M4 12l4-4M4 12l4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stash-mint-dark">
          Sweep target
        </p>
        <p className="font-mono text-xl font-semibold text-stash-ink">
          {wmonBalance !== undefined
            ? Number(formatEther(wmonBalance)).toLocaleString(undefined, { maximumFractionDigits: 4 })
            : "…"}{" "}
          <span className="text-sm font-medium text-stash-ink-soft">WMON</span>
        </p>
      </div>
    </div>
  );
}
