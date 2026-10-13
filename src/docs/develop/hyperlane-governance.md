## Understanding this dashboard

This public dashboard follows administrative activity for the Terra Classic Hyperlane deployment. It does not connect a wallet, collect signatures, submit votes, or execute transactions. Use the linked Safe, Squads, and governance applications to review and act.

### Different decisions, different thresholds

Terra Classic proposals follow the chain's deposit and voting process. Safe and Squads transactions follow their respective administrative approval thresholds. These thresholds are separate from the ISM validator thresholds used to verify cross-chain messages.

A recorded quorum is not proof of execution. Safe transactions can be waiting on an earlier nonce or compete for the same nonce. Squads proposals can be affected by a time lock or a configuration change. Always review the transaction's target, messages, parameters, and current state in its source application.

### Scope and freshness

The panel refreshes every two minutes, with a server cache of up to one minute. Each source has its own check time and availability. An unavailable source does not mean there are no proposals or pending transactions. Historical data is bounded and does not represent a complete audit trail.

Terra Classic proposals are matched by exact contract fields in their on-chain messages against the maintained Hyperlane inventory. Text-only proposals and forum discussions are not automatically classified as administrative actions. Live tallies are voting-power amounts, not forecasts of whether a proposal will pass.

Safe confirmations come from the Safe Transaction Service; they are recorded approvals, not an independent validation of every signature. Current membership is used to count pending confirmations when available. Solana proposal states and membership are read from Squads v4 accounts. Closed proposal accounts are absent from Solana history, and associated Solana instructions must be reviewed in Squads.

### Ownership is specific to a role

An operational contract owner, a pending owner, a CosmWasm migration admin, and a Solana program upgrade authority can be different accounts. The authority panel covers five Terra Classic contracts, the documented EVM owners and ProxyAdmin owners, and three Solana program upgrade authorities. It does not verify every authority, EVM proxy linkage, or Solana operational owner.

On Solana, the [deployment inventory](https://github.com/terra-classic-hyperlane/cw-hyperlane/blob/main/terraclassic/doc/HYPERLANE_DEPLOYMENT-MAINNET_EN.md) identifies `De1McrvkHNCTs8aYrirqdRVyWcK7DTtEJyMnqGe7gVhr` as the Squads configuration account and `UyvAB4vzpbzUfSQP4uStLPz2Td1coSJcosCRGV4vHmr` as its vault. The vault reference comes from that inventory; the panel reads the configuration account independently. Neither address is a bridge deposit destination.

For the network-wide voting process, see [Terra Classic Governance](/docs/learn/governance). For deployment addresses, see [Contracts and Warp routes](/docs/develop/hyperlane/contracts).
