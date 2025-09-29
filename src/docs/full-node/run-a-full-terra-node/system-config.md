> **Caution — Recommended operating systems**
>
> This guide has been tested against Ubuntu and Debian Linux distributions only. For production environments, deploy on one of these distributions to ensure consistent tooling and support.

Running a full Terra node is a resource-intensive process that requires a persistent server. If you want to use the Terra Classic blockchain without downloading the entire state, use a [Wallet](/docs/learn/wallets).

## Hardware requirements

Minimum specifications for a reliable full node:

- Six or more CPU cores
- At least 64 GB of memory
- At least 300 Mbps of sustained network bandwidth
- At least 2 TB NVMe SSD storage

> **Warning — Storage headroom**
>
> Network growth continually increases storage usage. Plan for additional capacity beyond the minimum to avoid emergency migrations. It is reported, that fully pruned nodes can run on a 1 TB NVMe SSD, though the recommended storage is 2 TB or more.

## Prerequisites

- Install [Golang v1.22.12 for Linux/amd64](https://go.dev/dl/go1.22.12.linux-amd64.tar.gz) or a compatible release.
- On Linux, install build tooling with `sudo apt-get install -y build-essential`.

### Installing Go (macOS & Linux)

Go release binaries are available at [go.dev/dl](https://go.dev/dl/). Download and install the archive for your platform:

```bash
# 1. Download the archive
wget https://go.dev/dl/go1.22.12.linux-amd64.tar.gz

# Optional: remove previous /go files
sudo rm -rf /usr/local/go

# 2. Unpack
sudo tar -C /usr/local -xzf go1.22.12.linux-amd64.tar.gz

# 3. Add Go to your PATH
export PATH=$PATH:/usr/local/go/bin

# (Persist the PATH update by appending the line above to ~/.profile or ~/.bashrc.)

# 4. Verify the installation
go version
# go version go1.22.12 linux/amd64
```

## Commonly used ports

`terrad` exposes multiple TCP ports. Adjust firewall rules to fit your topology.

- `26656` — P2P gossip. Required for joining the network. Validators typically restrict public ingress and instead maintain persistent peers.
- `26657` — RPC interface for queries and transaction submission.
- `1317` — LCD (REST) endpoint. Enable when external services need REST access.

> **Warning — Public RPC**
>
> Do not expose port `26657` to the public unless you intend to operate a public RPC node with appropriate rate limiting and monitoring.
