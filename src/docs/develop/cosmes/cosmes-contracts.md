# Smart contracts with CosmES

Upload code, instantiate contracts, execute messages, and query state on Terra Classic using `@goblinhunt/cosmes`.

## Prerequisites

- Wallet connection (Keplr, Galaxy Station, or `MnemonicWallet`)
- RPC: [https://terra-classic-rpc.publicnode.com](https://terra-classic-rpc.publicnode.com)
- Chain ID: `columbus-5`

## Upload code (`MsgStoreCode`)

```ts
import { MsgStoreCode } from "@goblinhunt/cosmes/client";
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

const wasmBytes = new Uint8Array(
  await (await fetch("/path/to/contract.wasm")).arrayBuffer()
);

const msg = new MsgStoreCode({
  sender: connected?.address ?? "",
  wasmByteCode: wasmBytes,
});

const unsigned = { msgs: [msg], memo: "store code" };
const fee = await connected?.estimateFee(unsigned, 1.2);
const txHash = await connected?.broadcastTx(unsigned, fee);
console.log("store code txhash", txHash);
```

## Instantiate (`MsgInstantiateContract`)

```ts
import { MsgInstantiateContract } from "@goblinhunt/cosmes/client";

const instantiate = new MsgInstantiateContract({
  sender: connected?.address ?? "",
  admin: connected?.address,
  codeId: 1234,
  label: "counter",
  msg: { count: 0 },
  funds: [{ denom: "uluna", amount: "1000000" }],
});

const unsigned = { msgs: [instantiate], memo: "instantiate" };
const fee = await connected?.estimateFee(unsigned, 1.2);
const txHash = await connected?.broadcastTx(unsigned, fee);
console.log("instantiate txhash", txHash);
```

## Execute (`MsgExecuteContract`)

```ts
import { MsgExecuteContract } from "@goblinhunt/cosmes/client";

const exec = new MsgExecuteContract({
  sender: connected?.address ?? "",
  contract: "terra1...contract",
  msg: { increment: {} },
  funds: [],
});

const unsigned = { msgs: [exec], memo: "execute" };
const fee = await connected?.estimateFee(unsigned, 1.2);
const txHash = await connected?.broadcastTx(unsigned, fee);
console.log("execute txhash", txHash);
```

## Query contract state

```ts
import { queryContract } from "@goblinhunt/cosmes/client";

const RPC = "https://terra-classic-rpc.publicnode.com";
const response = await queryContract(RPC, {
  address: "terra1...contract",
  query: { get_count: {} },
});
console.log(response);
```

> **Notes**
> - Gas price references: [terra-classic-lcd.publicnode.com/terra/tax/v1beta1/params](https://terra-classic-lcd.publicnode.com/terra/tax/v1beta1/params) and [terra-classic-fcd.publicnode.com/v1/txs/gas_prices](https://terra-classic-fcd.publicnode.com/v1/txs/gas_prices).
> - Market swaps are disabled on Classic; use DEX contracts for trading.
