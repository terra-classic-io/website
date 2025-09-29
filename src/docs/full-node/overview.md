## Production-grade infrastructure

Terra Classic full nodes replicate the entire blockchain. They expose LCD and RPC interfaces, relay gossip, and participate in consensus when configured as validators.

Deploy nodes on hardened Linux distributions such as Ubuntu 24.04 LTS or Debian 12. Optimise kernel parameters for high-throughput networking and disable non-essential services. Make sure to protect your network from DDoS attacks and unauthorized access.

### Deployment checklist

- Provision NVMe storage with sustained throughput above 400 MB/s.
- Allocate 8+ CPU/vCPU and 64 GB RAM for validators; 8+ CPU/vCPU and 32 GB RAM for sentry nodes.
- Configure swap space to prevent OOM kills.
- Restrict inbound access with firewalls and expose Prometheus metrics (if enabled) over authenticated channels only.
- Install Go 1.22.x and compile the latest `terrad` release from the Terra Classic GitHub repository.
- Automate encrypted backups for `config`, `data`, and `keyring` directories.

## Sentry and validator topology

Protect consensus keys by isolating validator nodes and routing inbound connections through sentries.

- Keep validator nodes on private networks and allow ingress only from trusted sentries.
- Use `persistent_peers` for validator-to-sentry links and `seeds` for general peer discovery.
- Instrument nodes with Prometheus and alert on missed blocks, disk utilisation, and peer latency, or use external services for validator monitoring.

> **Key management**
> Store mnemonic phrases offline. For validators, prefer hardware-backed key management.
