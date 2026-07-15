import "dotenv/config";
import { createRequire } from "node:module";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";
import { CHAIN_ID, RPC_URL } from "./config/addresses.js";

// Hardhat's default `solidity.profiles.*.version` downloads solc from
// binaries.soliditylang.org. That host is blocked by this sandbox's egress
// proxy, so instead we point Hardhat at the solc binary bundled inside the
// `solc` npm package (installed from the always-reachable npm registry) via
// its documented `path` config option — no network fetch of the compiler at
// build time. See node_modules/hardhat/dist/.../compiler/index.js:
// `getCompiler(version, { compilerPath })`.
const require = createRequire(import.meta.url);
const solcPath = require.resolve("solc/soljson.js");

// The `solc` npm package's own version *is* the compiler version it bundles
// (see node_modules/solc/package.json), and package.json pins it with no
// caret so `npm install` can't silently resolve a different one. Assert it
// here too so a manual edit to either the pin or SOLIDITY_VERSION below
// fails loudly at config load instead of silently compiling with the wrong
// compiler.
const SOLIDITY_VERSION = "0.8.28";
const installedSolcVersion: string = require("solc/package.json").version;
if (installedSolcVersion !== SOLIDITY_VERSION) {
  throw new Error(
    `hardhat.config.ts declares solidity version ${SOLIDITY_VERSION} but the installed ` +
      `solc package is ${installedSolcVersion}. Update SOLIDITY_VERSION or pin ` +
      `"solc": "${SOLIDITY_VERSION}" (no caret) in package.json and reinstall.`,
  );
}

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: SOLIDITY_VERSION,
        path: solcPath,
      },
      production: {
        version: SOLIDITY_VERSION,
        path: solcPath,
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    monadTestnet: {
      type: "http",
      chainType: "l1",
      url: RPC_URL,
      chainId: CHAIN_ID,
      accounts: [configVariable("MONAD_TESTNET_PRIVATE_KEY")],
    },
  },
});
