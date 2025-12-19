## Requirements

Make sure you have set up the local network and that it is up and running:

You should also have the latest version of `terrad` by building the latest version of Terra Core. You will configure `terrad` to use it against your isolated testnet environment.

In a separate terminal, make sure to set up the following mnemonic:

```bash
terrad keys add test1 --recover
```

Using the mnemonic from the [LocalNet](/docs/develop/smart-contracts/docs/develop/terra-core-localnet) guide.

## Uploading Code

Make sure that the **optimized build** of `my_first_contract.wasm` that you created in the last section is in your current working directory.

```bash
terrad tx wasm store artifacts/my_first_contract.wasm --from test1 --chain-id=localterra --gas=auto --gas-prices=28.325uluna --broadcast-mode=sync
```

Or, if you are on an arm64 machine:

```bash
terrad tx wasm store artifacts/my_first_contract-aarch64.wasm --from test1 --chain-id=localterra --gas=auto --gas-prices=28.325uluna --broadcast-mode=sync
```

This will ask for a confirmation before broadcasting to LocalTerra, type `y` and press enter.

You should see output similar to the following:

```bash
height: 6
txhash: 83BB9C6FDBA1D2291E068D5CF7DDF7E0BE459C6AF547EC82652C52507CED8A9F
codespace: ""
code: 0
data: ""
rawlog: '[{"msg_index":0,"log":"","events":[{"type":"message","attributes":[{"key":"action","value":"store_code"},{"key":"module","value":"wasm"}]},{"type":"store_code","attributes":[{"key":"sender","value":"terra1dcegyrekltswvyy0xy69ydgxn9x8x32zdtapd8"},{"key":"code_id","value":"1"}]}]}]'
logs:
- msgindex: 0
  log: ""
  events:
  - type: message
    attributes:
    - key: action
      value: store_code
    - key: module
      value: wasm
  - type: store_code
    attributes:
    - key: sender
      value: terra1dcegyrekltswvyy0xy69ydgxn9x8x32zdtapd8
    - key: code_id
      value: "1"
info: ""
gaswanted: 681907
gasused: 680262
tx: null
timestamp: ""
```

As you can see, your contract was successfully instantiated with Code ID #1.

You can check it out (this will download the wasm file from the network):

```bash
terrad query wasm code 1
```

## Creating the Contract

You have now uploaded the code for your contract, but still don't have a contract. Create it with the following InitMsg:

```json
{
  "count": 0
}
```

You can compress the JSON into 1 line with [this online tool](https://goonlinetools.com/json-minifier/).

```bash
terrad tx wasm instantiate 1 '{"count":0}' --from test1 --chain-id=localterra --fees=28.325uluna --gas=auto --broadcast-mode=sync
```

You should get a response like the following:

```bash
height: 41
txhash: AEF6F2FA570029A5D4C0DA5ACFA4A2B614D5811E29EEE10FF59F821AFECCD399
codespace: ""
code: 0
data: ""
rawlog: '[{"msg_index":0,"log":"","events":[{"type":"instantiate_contract","attributes":[{"key":"owner","value":"terra1dcegyrekltswvyy0xy69ydgxn9x8x32zdtapd8"},{"key":"code_id","value":"1"},{"key":"contract_address","value":"terra18vd8fpwxzck93qlwghaj6arh4p7c5n896xzem5"}]},{"type":"message","attributes":[{"key":"action","value":"instantiate_contract"},{"key":"module","value":"wasm"}]}]}]'
logs:
- msgindex: 0
  log: ""
  events:
  - type: instantiate_contract
    attributes:
    - key: owner
      value: terra1dcegyrekltswvyy0xy69ydgxn9x8x32zdtapd8
    - key: code_id
      value: "1"
    - key: contract_address
      value: terra18vd8fpwxzck93qlwghaj6arh4p7c5n896xzem5
  - type: message
    attributes:
    - key: action
      value: instantiate_contract
    - key: module
      value: wasm
info: ""
gaswanted: 120751
gasused: 120170
tx: null
timestamp: ""
```

If the output does not contain detailed event logs, you need to query the chain for the transaction hash:

```bash
terrad query tx AEF6F2FA570029A5D4C0DA5ACFA4A2B614D5811E29EEE10FF59F821AFECCD399
```

From the output, you can see that your contract was created above at: `terra18vd8fpwxzck93qlwghaj6arh4p7c5n896xzem5`. Take note of this contract address, as you will need it for the next section.

Check out your contract information:

```bash
terrad query wasm contract terra18vd8fpwxzck93qlwghaj6arh4p7c5n896xzem5
address: terra18vd8fpwxzck93qlwghaj6arh4p7c5n896xzem5
owner: terra1dcegyrekltswvyy0xy69ydgxn9x8x32zdtapd8
codeid: 1
...
```

You can use the following command to decode any Base64 strings you see in responses or events:

```bash
echo eyJjb3VudCI6MH0= | base64 --decode
```

This for example will produce the message you used when initializing the contract:

```json
{ "count": 0 }
```

## Executing the Contract

Let's do the following:

1. Reset count to 5
2. Increment twice

If done properly, you should get a count of 7.

### Reset

First, to reset:

```json
{
  "reset": {
    "count": 5
  }
}
```

```bash
terrad tx wasm execute terra18vd8fpwxzck93qlwghaj6arh4p7c5n896xzem5 '{"reset":{"count":5}}' --from test1 --chain-id=localterra --fees=28.325uluna --gas=auto --broadcast-mode=sync
```

### Incrementing

```json
{
  "increment": {}
}
```

```bash
terrad tx wasm execute terra18vd8fpwxzck93qlwghaj6arh4p7c5n896xzem5 '{"increment":{}}' --from test1 --chain-id=localterra --gas=auto --fees=28.325uluna --broadcast-mode=sync
```

### Querying count

Check the result of your executions!

```json
{
  "get_count": {}
}
```

```bash
terrad query wasm contract-store terra18vd8fpwxzck93qlwghaj6arh4p7c5n896xzem5 '{"get_count":{}}'
```

Expected output:

```text
query_result:
  count: 7
```

Excellent! Congratulations, you've created your first smart contract, and now know how to get developing with the Terra Classic dApp Platform.

## What's Next?

We've only walked through a simple example of a smart contract, that modifies a simple balance within its internal state. Although this is enough to make a simple dApp, you can power more interesting applications by **emitting messages**, which will enable you to interact with other contracts as well as the rest of the blockchain's module.

Check out a couple more examples of smart contracts using CosmWasm's smart contract [repo](https://github.com/CosmWasm/cosmwasm/tree/main/contracts).
