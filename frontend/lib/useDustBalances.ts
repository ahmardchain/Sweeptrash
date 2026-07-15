"use client";

import { useReadContracts } from "wagmi";
import { ERC20_ABI } from "./contracts";
import type { DeployedToken } from "./useDeployedTokens";

export interface DustBalance {
  token: DeployedToken;
  balance: bigint;
}

export function useDustBalances(tokens: DeployedToken[], owner: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContracts({
    contracts: tokens.map((t) => ({
      address: t.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: owner ? ([owner] as const) : undefined,
    })),
    query: { enabled: Boolean(owner) && tokens.length > 0 },
  });

  const balances: DustBalance[] = tokens.map((token, i) => ({
    token,
    balance: (data?.[i]?.result as bigint | undefined) ?? 0n,
  }));

  return { balances, isLoading, refetch };
}
