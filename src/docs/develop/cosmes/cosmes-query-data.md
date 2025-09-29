# Query data with CosmES

CosmES client helpers take the RPC endpoint string directly—no manual `RpcClient` is required.

## Native balances

```ts
import { getNativeBalances } from "@goblinhunt/cosmes/client";

const RPC = "https://terra-classic-rpc.publicnode.com";
const balances = await getNativeBalances(RPC, { address: "terra1..." });
console.log(balances);
```

## Account info

```ts
import { getAccount } from "@goblinhunt/cosmes/client";

const RPC = "https://terra-classic-rpc.publicnode.com";
const account = await getAccount(RPC, { address: "terra1..." });
console.log(account);
```

## Contract query

```ts
import { queryContract } from "@goblinhunt/cosmes/client";

const RPC = "https://terra-classic-rpc.publicnode.com";
const contract = "terra1...";
const response = await queryContract(RPC, {
  address: contract,
  query: { config: {} },
});
console.log(response);
```

> **Notes**
> - Batch queries when building dApp front-ends to reduce RPC overhead.
> - Use private infrastructure or a dedicated provider for production workloads.
