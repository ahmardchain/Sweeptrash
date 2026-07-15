import { ConnectButton } from "@rainbow-me/rainbowkit";
import { DustDashboard } from "@/components/DustDashboard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-stash-border px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stash-mint font-display text-lg font-bold text-white">
            S
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-none text-stash-ink">SweepStash</p>
            <p className="text-xs text-stash-ink-soft">tidy up your dust, on-chain</p>
          </div>
        </div>
        <ConnectButton />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-stash-ink sm:text-4xl">
            Sweep your dust into one asset.
          </h1>
          <p className="mt-2 max-w-xl text-stash-ink-soft">
            Every swap below is a real transaction on Monad Testnet — click any tx hash to verify it
            on the explorer yourself.
          </p>
        </div>

        <DustDashboard />
      </main>

      <footer className="border-t border-stash-border px-6 py-5 text-center text-xs text-stash-ink-soft sm:px-10">
        Built for the Spark hackathon on Monad Testnet.
      </footer>
    </div>
  );
}
