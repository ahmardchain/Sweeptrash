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

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        path: solcPath,
      },
      production: {
        version: "0.8.28",
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
