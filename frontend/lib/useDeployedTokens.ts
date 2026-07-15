"use client";

import { useEffect, useState } from "react";

export interface DeployedToken {
  address: string;
  name: string;
  symbol: string;
}

interface DeployedTokensResponse {
  tokens: DeployedToken[];
  seeded: boolean;
}

export function useDeployedTokens() {
  const [data, setData] = useState<DeployedTokensResponse>({ tokens: [], seeded: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/deployed-tokens")
      .then((res) => res.json())
      .then((json: DeployedTokensResponse) => {
        if (!cancelled) setData(json);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, isLoading };
}
