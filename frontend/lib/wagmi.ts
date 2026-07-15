import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { monadTestnet } from "./chain";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!walletConnectProjectId && typeof window !== "undefined") {
  console.warn(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Browser wallets (e.g. MetaMask) " +
      "will still work, but WalletConnect-based wallets won't. Get a free project ID at " +
      "https://cloud.reown.com and add it to frontend/.env.local.",
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "SweepStash",
  projectId: walletConnectProjectId || "sweepstash-dev-placeholder",
  chains: [monadTestnet],
  ssr: true,
});
