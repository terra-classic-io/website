# Get started with CosmES

Install the `@goblinhunt/cosmes` SDK and connect Terra Classic wallets to build TypeScript dApps.

## Prerequisites

- Node.js 18+
- Yarn (or pnpm)
- TypeScript project configured for ESM

## Install packages

```bash
yarn add @goblinhunt/cosmes
```

Recommended `tsconfig.json` options:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

## Choose a wallet controller

- **Galaxy Station** (`GalaxyStationController`) via WalletConnect v2
- **Keplr** browser extension (`KeplrController`)
- Also supported: Orbitar, Cosmostation, LUNC Dash mobile

### Connect Galaxy Station (example)

```ts
import { GalaxyStationController, WalletType } from "@goblinhunt/cosmes/wallet";

const CHAIN_ID = "columbus-5";
const RPC = "https://terra-classic-rpc.publicnode.com";

export async function connectGalaxyStation(): Promise<void> {
  const controller = new GalaxyStationController("<YOUR_WC_PROJECT_ID>");
  const wallets = await controller.connect(WalletType.WALLETCONNECT, [
    {
      chainId: CHAIN_ID,
      rpc: RPC,
      gasPrice: { denom: "uluna", amount: "28.325" },
    },
  ]);
  const connected = wallets.get(CHAIN_ID);
  console.log("address", connected?.address);
}
```

If you use Vite, define `global` for legacy WalletConnect v1 flows:

```ts
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  define: { global: "window" },
});
```

When connecting Station through WalletConnect v1, polyfill `Buffer`:

```ts
// polyfill.ts
import { Buffer } from "buffer";

(window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
```

Import the polyfill before bootstrapping your app.

## Configure network endpoints

- Chain ID: `columbus-5`
- LCD: [https://terra-classic-lcd.publicnode.com](https://terra-classic-lcd.publicnode.com)
- RPC: [https://terra-classic-rpc.publicnode.com](https://terra-classic-rpc.publicnode.com)
- Gas prices: [https://terra-classic-fcd.publicnode.com/v1/txs/gas_prices](https://terra-classic-fcd.publicnode.com/v1/txs/gas_prices)

Testnet `rebel-2`:

- LCD: [https://lcd.luncblaze.com](https://lcd.luncblaze.com)
- RPC: [https://rpc.luncblaze.com](https://rpc.luncblaze.com)

## Connect Keplr

```ts
import { KeplrController, WalletType } from "@goblinhunt/cosmes/wallet";

const CHAIN_ID = "columbus-5";
const RPC = "https://terra-classic-rpc.publicnode.com";

export async function connectKeplr(): Promise<void> {
  const controller = new KeplrController("<YOUR_WC_PROJECT_ID>");
  const wallets = await controller.connect(WalletType.EXTENSION, [
    {
      chainId: CHAIN_ID,
      rpc: RPC,
      gasPrice: { denom: "uluna", amount: "28.325" },
    },
  ]);
  const connected = wallets.get(CHAIN_ID);
  console.log("address", connected?.address);
}
```

## Read balances

```ts
import { getNativeBalances } from "@goblinhunt/cosmes/client";

const RPC = "https://terra-classic-rpc.publicnode.com";
const balances = await getNativeBalances(RPC, { address: "terra1..." });
console.log(balances);
```

## Send tokens

```ts
import { MsgSend } from "@goblinhunt/cosmes/client";
import { KeplrController, WalletType } from "@goblinhunt/cosmes/wallet";

const CHAIN_ID = "columbus-5";
const RPC = "https://terra-classic-rpc.publicnode.com";

async function send(): Promise<void> {
  const controller = new KeplrController("<YOUR_WC_PROJECT_ID>");
  const wallets = await controller.connect(WalletType.EXTENSION, [
    {
      chainId: CHAIN_ID,
      rpc: RPC,
      gasPrice: { denom: "uluna", amount: "28.325" },
    },
  ]);
  const connected = wallets.get(CHAIN_ID);
  if (!connected) {
    throw new Error("Failed to connect wallet");
  }

  const msg = new MsgSend({
    fromAddress: connected.address,
    toAddress: "terra1...",
    amount: [{ denom: "uluna", amount: "100000" }],
  });

  const unsigned = { msgs: [msg], memo: "CosmES send" };
  const fee = await connected.estimateFee(unsigned, 1.2);
  const txHash = await connected.broadcastTx(unsigned, fee);
  console.log("txhash", txHash);
}
```

> **Notes**
> - Use `simulateTx` to estimate gas before broadcasting.
> - Confirm current burn/tax policy via LCD (`/terra/tax/v1beta1/params`) or governance notices.
