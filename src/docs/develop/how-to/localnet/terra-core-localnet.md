## Prerequisites

- git, make, Docker, and Docker Compose (depending on your setup)
- 16-32 GB RAM recommended

## Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/classic-terra/core.git terra-core
   cd terra-core
   ```

2. Start a localnet:

   ```bash
   make localnet-start
   ```

   This spins up a multi-validator local network with RPC and LCD endpoints. Keep it running in the background while you develop.

3. Endpoints (typical defaults):

   - RPC: `http://localhost:26657`
   - LCD: `http://localhost:1317`
   - gRPC: `http://localhost:9090`

4. Chain ID:

   - Usually `localterra` or `localnet` (check the console output). Use this in your SDK configuration.

## Using with CosmES

Example Keplr setup against localnet:

```ts
import { KeplrController, WalletType } from "@goblinhunt/cosmes/wallet";

const controller = new KeplrController("<YOUR_WC_PROJECT_ID>");
const wallets = await controller.connect(WalletType.EXTENSION, [
  {
    chainId: "localterra", // or "localnet"
    rpc: "http://localhost:26657",
    gasPrice: { denom: "uluna", amount: "28.325" },
  },
]);
const connected = wallets.get("localterra");
console.log("address", connected?.address);
```

> **Warning**
>
> Make sure to add the chain information to keplr before connecting.

## Tips

- If ports conflict, stop other chain processes or change ports in Terra Core configs.
- For contract workflows, use the same `Msg*` transactions in CosmES as on mainnet or testnet—only the endpoints and chain ID change.
