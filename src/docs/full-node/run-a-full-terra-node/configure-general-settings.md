## Directory overview

```text
~/.terra/config
├─ addrbook.json                # Peer registry
├─ app.toml                     # Application configuration
├─ client.toml                  # CLI defaults
├─ config.toml                  # Tendermint configuration
├─ genesis.json                 # Network genesis file
├─ node_key.json                # Node authentication key
└─ priv_validator_key.json      # Validator signing key
```

## Initialize and set the moniker

Assign a human-readable name to help other operators (and stakers if you plan to validate) identify your node:

```bash
terrad init <moniker>
```

You can update the moniker later using `terrad tx staking edit-validator --new-moniker <new-moniker>`.

## Minimum gas prices

Validators should set a minimum gas price to avoid spam:

1. Open `~/.terra/config/app.toml`.
2. Edit the `minimum-gas-prices` field with appropriate fee denominations.

```toml
minimum-gas-prices = "28.325uluna,0.52469usdr,0.75uusd,850.0ukrw,2142.855umnt,0.625ueur,4.9ucny,81.85ujpy,0.55ugbp,54.4uinr,0.95ucad,0.7uchf,0.95uaud,1.0usgd,23.1uthb,6.25usek,6.25unok,4.5udkk,10900.0uidr,38.0uphp,5.85uhkd,3.0umyr,20.0utwd"
```

You can find the current gas price recommendations [from FCD](https://terra-classic-fcd.publicnode.com/v1/txs/gas_prices) before finalizing the values.

## Enable the LCD API

The Lite Client Daemon exposes a REST API for external services:

1. Open `~/.terra/config/app.toml`.
2. In the `[api]` section, set `enable = true` to start the LCD service.
3. Optionally set `swagger = true` to expose Swagger documentation.

```toml
[api]
enable  = true
swagger = true
```

Restart your service to apply changes:

```bash
sudo systemctl restart terrad
```

The LCD listens on `http://127.0.0.1:1317` by default.

## Persisted peers and services

- Configure `persistent_peers` and `seeds` in `config.toml` to maintain reliable connectivity.
- Enable Prometheus metrics in `app.toml` (`[telemetry]`) and expose port `26660` only to trusted networks.
- Review the `p2p`, `rpc`, and `consensus` sections in `config.toml` to align timeouts, max inbound peers, and snapshot settings with your operations playbook.

> **Warning**
> Never share `priv_validator_key.json`. Duplicated validator keys can lead to double-signing and slashing.
