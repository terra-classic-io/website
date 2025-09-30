> **Under development**
>
> This section of the documentation is still under development. If you experience issues with the mentioned steps, please open an issue on the [GitHub repository](https://github.com/StrathCole/terra-classic.io/issues) or submit a Pull Request with a fix.

CosmES is a modern, tree-shakeable, pure-ESM SDK for Cosmos SDK chains. Use the `@goblinhunt/cosmes` fork for Terra Classic projects.

## Network endpoints

| Purpose | Endpoint |
| --- | --- |
| FCD-compatible API | [https://terra-classic-fcd.publicnode.com](https://terra-classic-fcd.publicnode.com) |
| RPC (mainnet) | [https://terra-classic-rpc.publicnode.com](https://terra-classic-rpc.publicnode.com) |
| RPC (rebel-2) | [https://rpc.luncblaze.com](https://rpc.luncblaze.com) |

> **Tip**
> PublicNode endpoints are suitable for development. For production workloads, operate your own infrastructure or purchase private access. Binodes provides backup endpoints at `https://api-lunc-rpc.binodes.com` (RPC).

## Wallets

- Galaxy Station (Hexxagon)
- Keplr
- Orbitar
- Cosmostation
- LUNC Dash mobile

CosmES includes controllers for Station, Keplr, Galaxy Station, LUNC Dash, Cosmostation, and a programmatic `MnemonicWallet`.

```ts
import { KeplrController, WalletType } from "@goblinhunt/cosmes/wallet";

const controller = new KeplrController("<YOUR_WC_PROJECT_ID>");
const wallets = await controller.connect(WalletType.EXTENSION, [
  {
    chainId: "columbus-5",
    rpc: "https://terra-classic-rpc.publicnode.com",
    gasPrice: { denom: "uluna", amount: "28.325" },
  },
]);
const connected = wallets.get("columbus-5");
```

## Install the SDK

```bash
yarn add @goblinhunt/cosmes
```

For TypeScript projects, enable modern module resolution:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

If you use Vite, define `global` for WalletConnect v1 compatibility (remove when no longer required):

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

## Quick start

```ts
import { getNativeBalances } from "@goblinhunt/cosmes/client";

const RPC = "https://terra-classic-rpc.publicnode.com"; // Prefer a private endpoint for production

async function main(): Promise<void> {
  const address = "terra1...";
  const balances = await getNativeBalances(RPC, { address });
  console.log(balances);
}

main().catch(console.error);
```

## Send tokens example

```ts
import { MsgSend } from "@goblinhunt/cosmes/client";
import { KeplrController, WalletType } from "@goblinhunt/cosmes/wallet";

const CHAIN_ID = "columbus-5";
const RPC = "https://terra-classic-rpc.publicnode.com";

async function sendExample(): Promise<void> {
  const controller = new KeplrController("<YOUR_WC_PROJECT_ID>");
  const wallets = await controller.connect(WalletType.EXTENSION, [
    { chainId: CHAIN_ID, rpc: RPC, gasPrice: { denom: "uluna", amount: "0.015" } },
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

  const unsigned = { msgs: [msg], memo: "hello from CosmES" };
  const fee = await connected.estimateFee(unsigned, 1.2);
  const txHash = await connected.broadcastTx(unsigned, fee);
  console.log("txhash", txHash);
}

sendExample().catch(console.error);
```

> **Notes**
>
> - Use `simulateTx` before broadcasting to confirm gas usage.
> - Classic burn/tax behaviour is governed via proposals. Confirm current policy (e.g., Tax2Gas) before assuming on-chain deductions.
