# Reset and troubleshooting

Occasionally you may need to reset your node to resolve configuration drift or data corruption. The steps below describe common recovery tasks.

## Complete reset

> **Warning**
>
> This will remove all blockchain history and reset the validator state while keeping your keys. This is a destructive operation and should only be used if you are sure you want to reset your node. Make sure to have a backup of your keys and the validator state before running this command!

```bash
terrad tendermint unsafe-reset-all
```

Running the command removes blockchain history under `~/.terra/data` and resets the validator state. Add `--keep-addr-book` to keep the address book file.

Expected output:

```text
[ INF ] Removed existing address book file=/home/user/.terra/config/addrbook.json
[ INF ] Removed all blockchain history dir=/home/user/.terra/data
[ INF ] Reset private validator file to genesis state keyFile=/home/user/.terra/config/priv_validator_key.json stateFile=/home/user/.terra/data/priv_validator_state.json
```

> **Tip**
>
> After a reset, confirm that `~/.terra/config/addrbook.json` contains peers. If it is missing, download a fresh address book before restarting.

## Change genesis

Delete the old genesis file and fetch a new copy from a trusted source (see [Sync](/docs/full-node/run-a-full-terra-node/sync)).

## Reset personal data

> **Danger**
>
> Do not delete `priv_validator_key.json` on production validators!  
> Replacing this file breaks your validator identity and risks slashing.
>
> Do not delete `priv_validator_state.json` on production validators!  
> This can lead to double-signing and severe slashing in the worst case.

To reset all personal data, remove both `~/.terra/config/priv_validator_state.json` and `~/.terra/config/node_key.json`.

## Node health checklist

Ensure the following files exist before resuming operations:

- `~/.terra/config/addrbook.json`
- `~/.terra/config/genesis.json`
- `~/.terra/data/priv_validator_state.json`
- `~/.terra/config/node_key.json`
- `~/.terra/config/priv_validator_key.json`

After recovery, resync via the standard process from the [Sync](/docs/full-node/run-a-full-terra-node/sync) guide.
