## Before syncing

- Clear `~/.terra/data` or use `terrad tendermint unsafe-reset-all` to remove historic blocks.
- If you want to keep your address book, use `terrad tendermint unsafe-reset-all --keep-addr-book`.
- Preserve validator keys located in `~/.terra/config/priv_validator_key.json`.
- Ensure a recent address book exists at `~/.terra/config/addrbook.json`. If not, download one from a trusted community source.

> **Warning**
>
> Make sure to back up your validator keys. Make sure the same key is **never** used by multiple nodes, as this will result in severe slashing.

## Monitor progress

After starting your node, inspect the `SyncInfo` section of `terrad status`. Compare `latest_block_height` with an external source such as [validator.info](https://validator.info/terra-classic/).

```bash
terrad start
terrad status
```

`catching_up` moves from `true` to `false` once the node reaches the network head.

> **Tip**
>
> Syncing from genesis can take months and involves massive storage requirements. It is recommended to use a snapshot to bootstrap your node.

## Use snapshots

Snapshots accelerate bootstrap time. Providers include:

- [snapshots.hexxagon.io/cosmos/terra-classic/columbus-5/](https://snapshots.hexxagon.io/cosmos/terra-classic/columbus-5/)
- [publicnode.com/snapshots](https://www.publicnode.com/snapshots)

### Download prerequisites

```bash
sudo apt-get install wget liblz4-tool aria2 -y
```

### Fetch and unpack snapshot

```bash
aria2c -x5 "$URL" # or use curl / wget
FILE=$(basename "$URL")
lz4 -d "$FILE"
TARBALL="${FILE%.lz4}"
tar -xvf "$TARBALL" -C ~/.terra
```

Replace `$URL` with the `.tar.lz4` snapshot link for your target network. The extracted contents must populate `~/.terra/data/`.
