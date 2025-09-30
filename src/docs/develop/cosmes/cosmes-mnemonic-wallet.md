Use `MnemonicWallet` when you need to sign and broadcast transactions from scripts, backends, or test suites without a browser wallet.

## Create the wallet

```ts
import { MnemonicWallet } from "@goblinhunt/cosmes/wallet";

const wallet = new MnemonicWallet({
  mnemonic: "pronounce replace this with your 12-24 word mnemonic",
  bech32Prefix: "terra",
  chainId: "columbus-5",
  rpc: "https://terra-classic-rpc.publicnode.com",
  gasPrice: { denom: "uluna", amount: "28.325" },
  coinType: 330,
  index: 0,
});

console.log("address", wallet.address);
```

## Sign and broadcast

```ts
import { MsgSend } from "@goblinhunt/cosmes/client";

const msg = new MsgSend({
  fromAddress: wallet.address,
  toAddress: "terra1...",
  amount: [{ denom: "uluna", amount: "100000" }],
});

const unsigned = { msgs: [msg], memo: "mnemonic wallet send" };
const fee = await wallet.estimateFee(unsigned, 1.2);
const txHash = await wallet.broadcastTx(unsigned, fee);
console.log("txhash", txHash);
```

> **Tips**
> - Fetch current gas prices from [terra-classic-fcd.publicnode.com/v1/txs/gas_prices](https://terra-classic-fcd.publicnode.com/v1/txs/gas_prices) or the LCD tax endpoint.
> - For rebel-2 testnet, switch `rpc` to [https://rpc.luncblaze.com](https://rpc.luncblaze.com).
