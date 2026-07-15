# SweepStash

Built for the [Spark hackathon](https://buildanything.so/hackathons/spark) on Monad.

## The problem

Every wallet accumulates "dust" — small leftover token balances from swaps,
airdrops, and LP rewards that are too small to bother swapping individually,
because the gas cost of a swap exceeds the value of the dust itself. Over
time this just piles up as clutter you can't easily clean up.

## What SweepStash does

SweepStash shows you every dust token in your connected wallet in one place,
then lets you consolidate all of it into a single target asset (WMON) with
one click. Every swap is a real on-chain transaction against a real Uniswap
V3 pool on Monad Testnet — there is no simulated or fake success state.
Click any transaction hash in the app and it resolves on the
[Monad Testnet explorer](https://testnet.monadexplorer.com).

## Tech stack

- **Contracts / scripts:** Solidity, Hardhat 3, OpenZeppelin Contracts, ethers.js v6, TypeScript
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, wagmi + viem, RainbowKit, Framer Motion

## Repo layout

```
config/addresses.ts   Single source of truth for every network/contract address
config/uniswap.ts      Uniswap V3 tick-math constants (full-range ticks, 1:1 sqrtPriceX96)
abis/                  Shared ABI fragments (ERC20, WMON, Uniswap V3) used by both scripts and frontend
contracts/DustToken.sol Minimal mintable ERC20 used to simulate dust balances
scripts/deploy.ts       Deploys 3 DustTokens, mints demo dust to the deployer
scripts/seedPools.ts    Creates 3 Uniswap V3 pools (dust token / WMON) and seeds liquidity
scripts/testSwap.ts     One real exactInputSingle swap — the de-risking checkpoint
frontend/               Next.js app (dashboard + sweep flow)
```

## Setup

### 1. Prerequisites

- Node.js 20+
- A Monad Testnet wallet with **at least ~26 testnet MON**. This covers
  wrapping 24 MON into WMON to seed 3 pools (8 each) plus gas for ~15
  transactions (Monad gas costs are a small fraction of a MON, so this is a
  generous buffer). Get testnet MON from the
  [official Monad faucet](https://faucet.monad.xyz/) — claims are rate
  limited (roughly 0.05–5 MON per 12 hours depending on wallet history), so
  you may need a couple of claims, or an alternate faucet such as
  [QuickNode's Monad faucet](https://faucet.quicknode.com/monad/testnet).
- **Never use a wallet that holds real funds for this.** Generate a fresh
  testnet-only wallet and use its private key below.

### 2. Install dependencies

```bash
npm install
```

This is an npm workspaces monorepo — one `npm install` at the repo root
installs both the Hardhat toolchain and the frontend's dependencies.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set `MONAD_TESTNET_PRIVATE_KEY` to the private key of your
funded testnet wallet (no `0x` prefix needed either way, both are accepted).
This key is only used locally by Hardhat scripts — it is never committed
(`.env` is gitignored).

Every network value and contract address (RPC URL, chain ID, explorer URL,
WMON address, Uniswap V3 Factory / SwapRouter02 / NonfungiblePositionManager
/ QuoterV2 addresses) lives in one place: **`config/addresses.ts`**, with a
comment on where each value was verified from. Nothing else in the repo
hardcodes an address.

### 4. Deploy the dust tokens

```bash
npm run deploy:tokens
```

Deploys `RandomAirdrop` (RAD), `ForgottenLPReward` (FLP), and `TestnetJunk`
(JUNK) — three `DustToken` instances — and mints 2 of each to your deployer
wallet. Writes the resulting addresses to `deployed-tokens.json` at the repo
root (this file is read by both later scripts and the frontend).

### 5. Seed Uniswap V3 pools

```bash
npm run seed:pools
```

For each dust token: wraps MON into WMON as needed, creates and initializes
a Uniswap V3 pool (0.3% fee tier) against WMON at a cosmetic ~1:1 starting
price, and mints a full-range liquidity position (8 of each side per pool).
This is the liquidity your test swaps and the frontend's "Sweep All" will
trade against.

### 6. Run the swap test — the de-risking checkpoint

```bash
npm run test:swap
```

Performs **one real `exactInputSingle` swap** of RAD into WMON via
SwapRouter02 and prints the transaction hash. Paste that hash into
[testnet.monadexplorer.com](https://testnet.monadexplorer.com) and confirm
it independently before moving on. If this script fails, that's a
stop-the-line problem — do not proceed to the frontend until a real swap
has confirmed on-chain.

### 7. Start the frontend

```bash
cp frontend/.env.local.example frontend/.env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Connect a wallet
(MetaMask or any injected wallet works without extra setup) on Monad
Testnet, using the same address you deployed/seeded with so it holds dust
to sweep. You should see your dust balances, and clicking **Sweep All**
performs a real sequential swap per token with live per-token progress and
a real explorer link for every transaction.

`frontend/.env.local`'s `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is optional —
browser wallets work without it. Get a free ID at
[cloud.reown.com](https://cloud.reown.com) if you want WalletConnect-based
wallets too.

## Known limitations

- **No USD pricing.** Dust amounts are shown in raw token units, not dollar
  value — there's no reliable price feed for these demo tokens, so we don't
  fake one.
- **Single target asset.** Sweeps always consolidate into WMON; there's no
  custom target selection (explicitly out of scope for this build).
- **No transaction history persistence.** The wallet's on-chain state is
  the source of truth; nothing is stored server-side. Refreshing the page
  re-reads live balances rather than replaying a saved session.
- **Thin, cosmetic liquidity.** Pools are seeded with a small, illustrative
  ~1:1 price for testnet purposes only — this does not reflect any real
  market price and is not meant to.
- **10% slippage tolerance** on swaps, computed from a live QuoterV2 quote
  immediately before each swap. This is generous by design, since testnet
  pools are thin and this isn't a price-sensitive trade — not a sign of
  imprecise pricing.
- **Desktop-oriented UI.** No dedicated mobile layout; this is built as a
  desktop demo.
