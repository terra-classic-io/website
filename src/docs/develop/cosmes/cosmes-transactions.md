## Bank send (`MsgSend`)

```ts
import { MsgSend } from "@goblinhunt/cosmes/client";
import { KeplrController, WalletType } from "@goblinhunt/cosmes/wallet";

const CHAIN_ID = "columbus-5";
const RPC = "https://terra-classic-rpc.publicnode.com";

async function send(): Promise<void> {
  const controller = new KeplrController("<YOUR_WC_PROJECT_ID>");
  const wallets = await controller.connect(WalletType.EXTENSION, [
    { chainId: CHAIN_ID, rpc: RPC, gasPrice: { denom: "uluna", amount: "28.325" } },
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

## Execute a contract (`MsgExecuteContract`)

```ts
import { MsgExecuteContract } from "@goblinhunt/cosmes/client";

const contract = "terra1...cw20";
const msg = new MsgExecuteContract({
  sender: connected.address,
  contract,
  msg: { transfer: { recipient: "terra1...dest", amount: "1000" } },
  funds: [],
});

const unsigned = { msgs: [msg], memo: "cw20 transfer" };
const fee = await connected.estimateFee(unsigned, 1.2);
const txHash = await connected.broadcastTx(unsigned, fee);
```

## IBC transfer (`MsgIbcTransfer`)

```ts
import { MsgIbcTransfer } from "@goblinhunt/cosmes/client";

const msg = new MsgIbcTransfer({
  sourcePort: "transfer",
  sourceChannel: "channel-XXXX",
  token: { denom: "uluna", amount: "100000" },
  sender: connected.address,
  receiver: "cosmos1...dest",
  timeoutHeight: { revisionNumber: "0", revisionHeight: "0" },
  timeoutTimestamp: "0",
});
```

## DEX swap templates

### Terraswap pair swap

```ts
const msg = new MsgExecuteContract({
  sender: connected.address,
  contract: "terra1...pair",
  msg: {
    swap: {
      offer_asset: {
        info: { native_token: { denom: "uluna" } },
        amount: "100000",
      },
      belief_price: "0.000123",
      max_spread: "0.005",
      to: connected.address,
    },
  },
  funds: [{ denom: "uluna", amount: "100000" }],
});
```

### Terraport router swap

```ts
const msg = new MsgExecuteContract({
  sender: connected.address,
  contract: "terra1...router",
  msg: {
    swap: {
      offer_asset: {
        info: { native_token: { denom: "uluna" } },
        amount: "100000",
      },
      to: connected.address,
    },
  },
  funds: [{ denom: "uluna", amount: "100000" }],
});
```

### CW20 offer swap

```ts
import { MsgExecuteContract } from "@goblinhunt/cosmes/client";

const hookMsg = { swap: { belief_price: "123.45", max_spread: "0.005", to: connected.address } };
const hook = Buffer.from(JSON.stringify(hookMsg)).toString("base64");

const msg = new MsgExecuteContract({
  sender: connected.address,
  contract: "terra1...cw20",
  msg: {
    send: {
      contract: "terra1...pair",
      amount: "500000",
      msg: hook,
    },
  },
  funds: [],
});
```

> **Important**
>
> - Replace contract addresses and fields with the DEX’ published schemas.
> - Always set `max_spread` or `minimum_receive` safeguards.
> - Use `queryContract` to discover pair addresses via factory contracts.

## Best practices

- Call `simulateTx` to estimate gas, then apply a margin (for example `1.2x`) before calculating fees.
- Refer to `docs/develop/endpoints.md` for production-grade infrastructure.
- On Terra Classic, market swaps are disabled; use DEX contracts instead.
