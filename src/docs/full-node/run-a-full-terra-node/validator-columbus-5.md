## Versions and network endpoints

| Component | Version |
| --- | --- |
| Terra Core | `v3.6.0` |
| Oracle Feeder | `v3.1.6` |
| Go | `go1.22.12` |

| Endpoint | URL |
| --- | --- |
| RPC | [https://terra-classic-rpc.publicnode.com](https://terra-classic-rpc.publicnode.com) |
| LCD | [https://terra-classic-lcd.publicnode.com](https://terra-classic-lcd.publicnode.com) |
| gRPC | `grpc://terra-classic-grpc.publicnode.com:443` |

> **Tip**
>
> Keep Binodes (`https://api-lunc-rpc.binodes.com`, `https://api-lunc-lcd.binodes.com`) configured as secondaries. Mirror your own sentry relay to avoid depending entirely on public endpoints.

## Hardware prerequisites

- Linux server (Ubuntu or Debian recommended)
- 6+ CPU cores (8+ recommended)
- 64 GB RAM minimum
- Swap space configured for cases of memory pressure
- 2 TB NVMe SSD (1 TB may work for fully pruned nodes but is not recommended)

## Install toolchain and build terrad

1. Follow the instructions in [System configuration](/docs/full-node/run-a-full-terra-node/system-config) and [Build Terra Core](/docs/full-node/run-a-full-terra-node/build-terra-core).

## Bootstrap chain data

1. Initialise the node configuration.

   ```bash
   terrad init <moniker>
   ```

2. Download the latest address book and genesis files.

   ```bash
   cd ~/.terra/config
   wget -O addrbook.json "https://snapshots.hexxagon.io/cosmos/terra-classic/columbus-5/addrbook.json"
   wget -O genesis.json "https://snapshots.hexxagon.io/cosmos/terra-classic/columbus-5/genesis.json"
   ```

3. In `config/app.toml`, disable fast IAVL (`iavl-disable-fastnode = true`) before restoring snapshots. Terra Classic Core v3 enables fast-node by default; validate this flag matches snapshot provider requirements.

4. Fetch a recent snapshot (replace the URL with the most recent archive).

   ```bash
   cd ~/.terra
   mv data data~backup
   wget -O snapshot.tar.lz4 "https://snapshots.publicnode.com/terra-classic-pruned-25311240-25311250.tar.lz4"
   # or
   # wget -O snapshot.tar.lz4 "https://snapshots.hexxagon.io/cosmos/terra-classic/columbus-5/snapshot-goleveldb-25309877.tar.lz4"
   lz4cat snapshot.tar.lz4 | tar xvf -
   ```

5. Start the node and confirm sync progress.

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

2. Fund `valwallet` with LUNC from an exchange or an existing wallet. Keep at least 10,000 LUNC to buffer against gas prices and oracle feeder set up.

3. Submit the validator registration (adjust commission and moniker as required).

   ```bash
   terrad tx staking create-validator \
     --amount "10000000uluna" \
     --commission-max-change-rate "0.01" \
     --commission-max-rate "0.2" \
     --commission-rate "0.05" \
     --min-self-delegation 1 \
     --pubkey "$(terrad tendermint show-validator)" \
     --moniker "myvalidator" \
     --chain-id columbus-5 \
     --gas auto \
     --gas-prices 28.325uluna \
     --gas-adjustment 1.4 \
     --from valwallet
   ```

4. Verify the validator status.

   ```bash
   terrad q staking validators | grep -A6 "myvalidator"
   ```

> **Warning**
>
> Some validator parameters (for example `commission-max-rate`) are immutable once set. Double-check every flag before broadcasting `create-validator`.

## Oracle feeder setup

1. Create an authorised feeder key and delegate privileges.

   ```bash
   terrad keys add feederwallet
   terrad tx oracle set-feeder <feederwallet> --from valwallet --chain-id columbus-5 --gas auto --gas-prices 30uluna --gas-adjustment 2
   ```

2. Enable the LCD API locally by editing `~/.terra/config/app.toml` and setting `enable = true` in the `[api]` section, then restart the node. Set `max-open-connections` to at least `1000` if exposing to feeders and tooling.

3. Deploy the oracle price server using Docker Compose or systemd. The binary now ships via GitHub releases; review the [oracle-feeder repository](https://github.com/classic-terra/oracle-feeder#readme) for updated flags. Example command:

   ```bash
   npm start vote -- \
     -d http://localhost:8532/latest \
     --lcd-url http://127.0.0.1:1317 \
     --validators <your-valoper-address> \
     --password <wallet-password>
   ```

## Unbonding and shutdown checklist

- Use `terrad tx staking unbond` to undelegate your stake before powering down the validator:

  ```bash
  terrad tx staking unbond <your-valoper-address> 10000000uluna --from valwallet --chain-id columbus-5 --gas auto --gas-prices 30uluna --gas-adjustment 2
  ```

- Confirm the validator reports `status: BOND_STATUS_UNBONDING` before shutting down services.

## Troubleshooting

- **Feeder wallet not found**: Ensure the feeder address holds a small LUNC balance so the chain recognises the account.
- **Feeder not submitting votes**: Confirm the LCD API is enabled locally and that the feeder/price server versions match the versions specified above. Check for `vote_period` changes after network upgrades and adjust `/etc/systemd/system/oracle-feeder.service` accordingly.
