## Versions and network endpoints

| Component | Version |
| --- | --- |
| Terra Core | `v3.6.0-rc.0` |
| Oracle Feeder | `v3.1.6` |
| Go | `go1.22.12` |

| Endpoint | URL |
| --- | --- |
| RPC | [https://rpc.luncblaze.com](https://rpc.luncblaze.com) |
| LCD | [https://lcd.luncblaze.com](https://lcd.luncblaze.com) |
| Snapshot | [https://luncblaze.com/rebel-2/rebel2-latest.tar.lz4](https://luncblaze.com/rebel-2/rebel2-latest.tar.lz4) |

> **Tip**
> Rebel-2 might require more frequent upgrades than mainnet. Keep your own testnet node or snapshot source ready for rapid restores.

## Prerequisites

- Linux server (Ubuntu/Debian recommended)
- ≥ 4 CPU cores
- 32 GB RAM minimum (48 GB to 64 GB preferred)
- Swap space configured for cases of memory pressure
- 1 TB NVMe SSD (2 TB recommended for pruning space and snapshots)

## Install toolchain and build `terrad`

1. Follow the instructions in [System configuration](/docs/full-node/run-a-full-terra-node/system-config) and [Build Terra Core](/docs/full-node/run-a-full-terra-node/build-terra-core).

> **Important**
>
> rebel-2 might require a different go version than mainnet. Check the version table above.

## Bootstrap chain data

1. Initialise node configuration for rebel-2.

   ```bash
   terrad init <testnet-moniker>
   ```

2. Download the latest address book and genesis files.

   ```bash
   cd ~/.terra/config
   wget -O addrbook.json "https://snapshots.luncblaze.com/rebel-2/addrbook.json"
   wget -O genesis.json "https://snapshots.luncblaze.com/rebel-2/genesis.json"
   ```

3. Ensure `iavl-disable-fastnode = false` in `config/app.toml` before restoring snapshots. Rebel-2 snapshots published after May 2025 expect fast-node mode.

4. Fetch a recent snapshot.

   ```bash
   cd ~/.terra
   mv data data~backup
   wget -O snapshot.tar.lz4 "https://snapshots.luncblaze.com/rebel-2/rebel2-latest.tar.lz4"
   lz4cat snapshot.tar.lz4 | tar xvf -
   ```

5. Start the node and wait for sync.

   ```bash
   terrad start
   terrad status
   ```

## Join the validator set

1. Create a signing key.

   ```bash
   terrad keys add valwallet
   terrad keys list
   ```

2. Request testnet LUNC through the [rebel-2 faucet bot](https://t.me/tcrebelfaucet_bot). Or [rebel-2 faucet by LuncGoblins](https://faucet.luncgoblins.com/). Operators @StrathCole and @fragwuerdig can assist if the faucet is offline.

3. Register the validator.

   ```bash
   terrad tx staking create-validator \
     --amount "10000000uluna" \
     --commission-max-change-rate "0.01" \
     --commission-max-rate "0.2" \
     --commission-rate "0.1" \
     --min-self-delegation 1 \
     --pubkey "$(terrad tendermint show-validator)" \
     --moniker "myvalidator" \
     --chain-id rebel-2 \
     --gas auto \
     --gas-prices 28.325uluna \
     --gas-adjustment 1.4 \
     --from valwallet
   ```

4. Confirm the validator is visible.

   ```bash
   terrad q staking validators | grep -A6 "myvalidator"
   ```

## Oracle feeder setup

1. Create the feeder wallet and delegate privileges.

   ```bash
   terrad keys add feederwallet
   terrad tx oracle set-feeder <feederwallet> --from valwallet --chain-id rebel-2 --gas auto --gas-prices 5uluna --gas-adjustment 2
   ```

2. Enable the local LCD (`enable = true` in `~/.terra/config/app.toml` under `[api]`) and restart the node. Use `max-open-connections = 500` to avoid exhausting sockets during stress tests.

3. Deploy the price server following the [oracle-feeder repository](https://github.com/classic-terra/oracle-feeder#readme). Example run command:

   ```bash
   npm start vote -- \
     -d http://localhost:8532/latest \
     --lcd-url http://127.0.0.1:1317 \
     --chain-id rebel-2 \
     --validators <your-valoper-address> \
     --password <wallet-password>
   ```

4. Join the validator coordination chat on Telegram (contact @StrathCole or @fragwuerdig) for upgrade announcements.

## Leaving the testnet safely

- Use `terrad tx staking unbond` to exit the active set:

  ```bash
  terrad tx staking unbond <your-valoper-address> 10000000uluna --from valwallet --chain-id rebel-2 --gas auto --gas-prices 5uluna --gas-adjustment 2
  ```

- Confirm the validator status becomes `BOND_STATUS_UNBONDING` before shutting down.

## Troubleshooting

- **Feeder wallet not found**: Fund the feeder wallet with a small LUNC balance so the account exists on-chain.
- **Price feeder idle**: Ensure the LCD API is running locally and that feeder/core versions match the listed versions.
