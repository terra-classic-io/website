# Build Terra Classic core

Terra Classic core is the official implementation of the Terra Classic node software. Use this guide to install `terrad`, the command-line interface and daemon that connects to Terra Classic and enables you to interact with the Terra Classic blockchain.

## Get the Terra Classic core source code

1. Use `git` to retrieve [Terra Classic core](https://github.com/classic-terra/core/) and check out the latest stable release, e.g. `v3.5.1`. See [here](https://github.com/classic-terra/core/releases) for a list of available releases.

   ```bash
   git clone https://github.com/classic-terra/core
   cd core
   git checkout [latest version] # ex., git checkout v3.5.1
   ```

2. Build Terra core. This installs the `terrad` executable to your [`GOPATH`](https://go.dev/doc/gopath_code) environment variable.

   ```bash
   make build install
   ```

3. Verify that Terra Classic core is installed correctly.

   ```bash
   terrad version --long
   ```

   **Example**:

   ```bash
   name: terra
   server_name: terrad
   client_name: terrad
   version: v3.5.1
   commit: 3684f77faadf6cf200d18e15763316d5d9c5a496
   build_tags: netgo,ledger
   go: go version go1.22.12 linux/amd64
   # ...And a list of dependencies
   ```

::: {tip}
If the `terrad: command not found` error message is returned, confirm that the Go binary path is correctly configured by running the following command:

```bash
export PATH=$PATH:$(go env GOPATH)/bin
```

:::
