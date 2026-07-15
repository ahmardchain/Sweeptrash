"use client";

import { useCallback, useState } from "react";
import { useAccount } from "wagmi";
import { readContract, simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { wagmiConfig } from "./wagmi";
import {
  ERC20_ABI,
  POOL_FEE_TIER,
  QUOTER_V2_ABI,
  QUOTER_V2_ADDRESS,
  SLIPPAGE_BPS,
  SWAP_ROUTER_02_ABI,
  SWAP_ROUTER_02_ADDRESS,
  WMON_ADDRESS,
} from "./contracts";
import { extractErrorMessage } from "./errors";
import { isTokenAllowed } from "../../config/tokenAllowlist";
import type { DustBalance } from "./useDustBalances";

export type SweepStatus =
  | "waiting"
  | "approving"
  | "quoting"
  | "swapping"
  | "confirmed"
  | "failed";

export interface SweepTokenState {
  status: SweepStatus;
  approveTxHash?: `0x${string}`;
  swapTxHash?: `0x${string}`;
  amountOut?: bigint;
  errorMessage?: string;
}

export function useSweepAll() {
  const { address } = useAccount();
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [states, setStates] = useState<Record<string, SweepTokenState>>({});

  const updateToken = useCallback((tokenAddress: string, patch: Partial<SweepTokenState>) => {
    setStates((prev) => ({
      ...prev,
      [tokenAddress]: { ...prev[tokenAddress], ...patch } as SweepTokenState,
    }));
  }, []);

  const sweepAll = useCallback(
    async (dustBalances: DustBalance[], allowlist: Set<string>) => {
      if (!address) return;

      const toSweep = dustBalances.filter((d) => d.balance > 0n);
      if (toSweep.length === 0) return;

      setPhase("running");
      const initial: Record<string, SweepTokenState> = {};
      for (const { token } of toSweep) initial[token.address] = { status: "waiting" };
      setStates(initial);

      for (const { token, balance } of toSweep) {
        const tokenIn = token.address as `0x${string}`;

        // Allowlist gate: refuse to approve or swap any token not on the
        // verified allowlist, before spending gas or touching an allowance.
        // The dashboard already filters to allowlisted tokens; this makes the
        // swap path itself unable to act on an untrusted address.
        if (!isTokenAllowed(token.address, allowlist)) {
          updateToken(token.address, {
            status: "failed",
            errorMessage: "Skipped — not on the verified token allowlist.",
          });
          continue;
        }

        try {
          updateToken(token.address, { status: "approving" });

          const currentAllowance = await readContract(wagmiConfig, {
            address: tokenIn,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, SWAP_ROUTER_02_ADDRESS as `0x${string}`],
          });

          if (currentAllowance < balance) {
            const approveHash = await writeContract(wagmiConfig, {
              address: tokenIn,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [SWAP_ROUTER_02_ADDRESS as `0x${string}`, balance],
            });
            updateToken(token.address, { approveTxHash: approveHash });
            await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
          }

          updateToken(token.address, { status: "quoting" });
          const { result: quoteResult } = await simulateContract(wagmiConfig, {
            address: QUOTER_V2_ADDRESS as `0x${string}`,
            abi: QUOTER_V2_ABI,
            functionName: "quoteExactInputSingle",
            args: [
              {
                tokenIn,
                tokenOut: WMON_ADDRESS as `0x${string}`,
                amountIn: balance,
                fee: POOL_FEE_TIER,
                sqrtPriceLimitX96: 0n,
              },
            ],
            account: address,
          });
          const [quotedAmountOut] = quoteResult;
          const amountOutMinimum = (quotedAmountOut * (10_000n - SLIPPAGE_BPS)) / 10_000n;

          updateToken(token.address, { status: "swapping" });
          const swapHash = await writeContract(wagmiConfig, {
            address: SWAP_ROUTER_02_ADDRESS as `0x${string}`,
            abi: SWAP_ROUTER_02_ABI,
            functionName: "exactInputSingle",
            args: [
              {
                tokenIn,
                tokenOut: WMON_ADDRESS as `0x${string}`,
                fee: POOL_FEE_TIER,
                recipient: address,
                amountIn: balance,
                amountOutMinimum,
                sqrtPriceLimitX96: 0n,
              },
            ],
          });
          updateToken(token.address, { swapTxHash: swapHash });
          await waitForTransactionReceipt(wagmiConfig, { hash: swapHash });

          updateToken(token.address, { status: "confirmed", amountOut: quotedAmountOut });
        } catch (error) {
          updateToken(token.address, {
            status: "failed",
            errorMessage: extractErrorMessage(error),
          });
          // one token failing shouldn't stop the rest of the sweep
        }
      }

      setPhase("done");
    },
    [address, updateToken],
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setStates({});
  }, []);

  return { phase, states, sweepAll, reset };
}
