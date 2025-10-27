Terra Classic core is the official implementation of the Terra Classic node software. Use this guide to install `terrad`, the command-line interface and daemon that connects to Terra Classic and enables you to interact with the Terra Classic blockchain.

## Get the Terra Classic core source code

1. Use `git` to retrieve [Terra Classic core](https://github.com/classic-terra/core/) and check out the latest stable release, e.g. `v3.6.0`. See [GitHub releases](https://github.com/classic-terra/core/releases) for a list of available releases.

   ```bash
   git clone https://github.com/classic-terra/core
   cd core
   git checkout [latest version] # ex., git checkout v3.6.0
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
   version: v3.6.0
   build_tags: netgo,ledger
   go: go version go1.22.12 linux/amd64
   # ...And a list of dependencies
   ```

> **Tip**
>
> If the `terrad: command not found` error message returns, confirm that the Go binary path is correctly configured by running the following command:

```bash
export PATH=$PATH:$(go env GOPATH)/bin
```
