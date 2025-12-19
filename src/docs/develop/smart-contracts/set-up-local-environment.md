As a smart contract developer, you will need to write, compile, upload, and test your contracts before deploying them on the Columbus-5 mainnet. The first step is to set up a specialized environment to streamline development.

## Install Terra Classic Core locally

Visit [run Localnet](docs/develop/terra-core-localnet) to install the latest version of Terra Classic Core to obtain a working version of `terrad`. You will need this to connect to your local Terra Classic test network to work with smart contracts.

In order to work with Terra Classic Smart Contracts, you should have access to a Terra Classic network that includes the WASM integration.

In this tutorial, you will be using a local validator network as a private testnet. This reduces the friction of development by giving you complete control of a private Terra Classic blockchain with the possibility to easily reset the world state.

You should now have a local testnet running on your machine, with the following configurations:

- Node listening on RPC port `26657`
- LCD running on port `1317`
- Swagger Documentation at [http://localhost:1317/swagger](http://localhost:1317/swagger)

> **TODO**
>
> This section needs updating to include the information about the keys of the local network validator keys / seeds!

## Install Rust

While WASM smart contracts can theoretically be written in any programming language, it is currently only recommended to use Rust as it is the only language for which mature libraries and tooling exist for CosmWasm. For this tutorial, you'll need to also install version 1.82 of Rust by following the instructions in the [official Rust documentation](https://www.rust-lang.org/tools/install).

Once you have installed Rust and its toolchain (cargo et al.), you'll need to add the `wasm32-unknown-unknown` compilation target.

```sh
rustup default 1.82.0
rustup target add wasm32-unknown-unknown
```

Then, install `cargo-generate`, which you will need for bootstrapping new CosmWasm smart contracts via a template.

```sh
cargo install cargo-generate --features vendored-openssl
```

Next, install `wasm-opt`, which is required to optimize smart contracts.

```sh
cargo install wasm-opt
```
