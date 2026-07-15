"use client";

import { useEffect, useState } from "react";
import type { DeployedToken } from "../../config/deployedTokens";

export type { DeployedToken };

interface DeployedTokensResponse {
  tokens: DeployedToken[];
  seeded: boolean;
  error?: string;
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
