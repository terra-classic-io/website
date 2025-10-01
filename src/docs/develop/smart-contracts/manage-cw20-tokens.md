According to the [official documentation](https://docs.rs/crate/cw20/1.1.0)

> CW20 is a specification for fungible tokens based on CosmWasm. The name and design is loosely based on Ethereum's ERC20 standard, but many changes have been made. The types in here can be imported by contracts that wish to implement this spec, or by contracts that call to any standard cw20 contract.

## Check CW20 balance

You can query balance via LCD or using CosmES in JavaScript.

- LCD (CosmWasm v1 smart query):

  1. Build the smart query and base64-encode it:  

    ```json
    { "balance": { "address": "<walletAddress>" } }
    ```
  
  1. Request:

    ```text
    GET /cosmwasm/wasm/v1/contract/<tokenContractAddress>/smart/<base64Query>
    Host: terra-classic-lcd.publicnode.com
    ```
  
  1. Example (placeholder base64 shown):

    ```text
    https://terra-classic-lcd.publicnode.com/cosmwasm/wasm/v1/contract/<tokenContractAddress>/smart/eyAiYmFsYW5jZSI6IHsgImFkZHJlc3MiOiAiPHdhbGxldEFkZHJlc3M+IiB9IH0=
    ```

- JavaScript (CosmES):

  ```ts
  import { getCw20Balance } from '@goblinhunt/cosmes/client';

  const RPC = 'https://terra-classic-rpc.publicnode.com';
  const token = '<tokenContractAddress>';
  const wallet = '<walletAddress>';
  const balance = await getCw20Balance(RPC, { address: wallet, token });
  console.log(balance.toString());
  ```

## Interact with a CW20 contract

- CW20 is a CosmWasm contract and `MsgExecuteContract` is used to interact with it.
- Breakdown of message payload format is as follows (similar to `bank/MsgSend` but `execute_msg` is added):

```json
{
  "type": "wasm/MsgExecuteContract",
  "value": {
    // sender address
    "sender": "terra1zyrpkll2xpgcdsz42xm3k8qfnddcdu0w7jzx6y",

    // token contract address
    "contract": "terra1rz5chzn0g07hp5jx63srpkhv8hd7x8pss20w2e",

    // base64-encoded payload of contract execution message (refer to below)
    "execute_msg": "ewogICJzZW5kIjogewogICAgImFtb3VudCI6ICIxMDAwMDAwMDAwIiwKICAgICJjb250cmFjdCI6IDxyZWNpcGllbnRDb250cmFjdEFkZHJlc3M+LAogICAgIm1zZyI6ICJleUp6YjIxbFgyMWxjM05oWjJVaU9udDlmUT09IiAKICB9Cn0=",

    // used in case you are sending native tokens along with this message
    "coins": []
  }
}
```

CosmES example for a CW20 `transfer`:

```ts
import { MnemonicWallet } from '@goblinhunt/cosmes/wallet';
import { MsgExecuteContract } from '@goblinhunt/cosmes/client';

const wallet = new MnemonicWallet({
  mnemonic: '<mnemonic>',
  bech32Prefix: 'terra',
  chainId: 'columbus-5',
  rpc: 'https://terra-classic-rpc.publicnode.com',
  gasPrice: { denom: 'uluna', amount: '28.325' },
  coinType: 330,
  index: 0,
});

const execMsg = { transfer: { recipient: '<recipient>', amount: '1000000' } } as const;

const msg = new MsgExecuteContract({
  sender: wallet.address,
  contract: '<tokenContractAddress>',
  msg: execMsg,
  funds: [],
});

const unsigned = { msgs: [msg], memo: 'cw20 transfer' };
const fee = await wallet.estimateFee(unsigned, 1.2);
const txHash = await wallet.broadcastTx(unsigned, fee);
console.log('txhash', txHash);
```

## Send CW20 to another contract and execute message

- Example
  - [Finder](https://finder.terraclassic.community/columbus-5/tx/99CFBABE9DBC1059EF40B985D17ED9CCBA11570B28B032D4E57D527FD298F60A)
  - [Raw result](https://terra-classic-lcd.publicnode.com/cosmos/tx/v1beta1/txs/99CFBABE9DBC1059EF40B985D17ED9CCBA11570B28B032D4E57D527FD298F60A)

```json
// base64-encode the below message (without the comments), send that as `execute_msg`
{
  "send": {
    // amount of CW20 tokens being transferred
    "amount": "1000000000",

    // recipient of this transfer
    "contract": <recipientContractAddress>,

    // execute_msg to be executed in the context of recipient contract
    "msg": "eyJzb21lX21lc3NhZ2UiOnt9fQ==" 
  }
}
```

## Transfer CW20 tokens

- `transfer` moves CW20 balance within the token contract. `send` both transfers and relays an execute message to the recipient contract.
- Example
  - [Finder](https://finder.terraclassic.community/columbus-5/tx/F424552E25FDE52FEC229E04AE719A5B91D99E1088DC5F4978B263516A269FB1)
  - [Raw result](https://terra-classic-lcd.publicnode.com/cosmos/tx/v1beta1/txs/F424552E25FDE52FEC229E04AE719A5B91D99E1088DC5F4978B263516A269FB1)
- Find other messages at [cw20 documentation](https://crates.io/crates/cw20)

```json
{
  "transfer": {
    "amount": "1000000",
    "recipient": "<recipient>"
  }
}
