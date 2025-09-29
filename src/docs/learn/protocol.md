Terra Classic combines proof-of-stake security and on-chain governance. This overview explains how LUNC, validators, and delegators all interact.

> **Important**
>
> Since May 2022, Terra Classic has no pegged stablecoins. TerraUSD (UST) have depegged and are currently considered a speculative asset.
>
> References to **stablecoins** in this document refer to the historical algorithmic operation of Terra.

## Terra and LUNC

- **LUNC** is the staking and governance asset. Validators and delegators stake LUNC to secure the chain, earn rewards, and participate in governance.
- **TerraUSD et al** historically tracked fiat currencies (for example TerraUSD `uusd`, TerraKRW `ukrw`, TerraSDR `usdr`). Users historically minted Terra by burning LUNC; on Classic, the mint/burn swap paths are disabled, but legacy supply mechanics still inform the protocol design.

## Stablecoin mechanics (historical)

Terra was designed around two supply pools—Terra and LUNC. The market module encouraged arbitrage to expand or contract stablecoin supply and keep prices near their pegs.

- **Expansion**: When Terra traded above the peg, burning LUNC to mint Terra increased supply and reduced the premium.
- **Contraction**: When Terra traded below the peg, burning Terra to mint LUNC reduced Terra supply.

> **Important**
> Following the 2022 hyperinflation event, Classic governance disabled market swap mint/burn paths. LUNC remains the staking asset, while stablecoin liquidity is community-maintained through dApps and DEXes.

## Validators and consensus

Validators run full nodes, propose blocks, and vote during Tendermint consensus.

1. A proposer is selected (weighted by stake) and broadcasts a block.
2. Validators vote in two rounds. If ≥2/3 of voting power signs both rounds, the block is committed.
3. Fees from the block enter the distribution module and are later shared with delegators.

Learn more in the validator guides under `Run a full node` and the [staking doc](./staking-and-governance.md).

## Staking lifecycle

- **Delegating**: Delegators bond LUNC to a validator to earn rewards. Staked LUNC contributes to validator voting power but always belongs to the delegator.
- **Bonded / unbonded / unbonding**: LUNC exists in three phases. Unbonding takes 21 days and does not accrue rewards.
- **Redelegation**: Move bonded stake between validators without waiting the unbonding period (subject to a 21-day cooldown per source/target pair).

### Slashing

Misbehaving validators are penalised by the slashing module:

- **Double-signing**: Signing conflicting blocks at the same height.
- **Downtime**: Failing to participate in consensus.
- **Oracle faults**: Missing required oracle votes (`x/oracle`).

Every slash reduces both validator self-bond and delegator stake, and the validator is jailed until conditions are resolved. Review the [slashing spec](../develop/module-specifications/spec-slashing.md) for parameters.

## Governance

Terra Classic governance lets stakers steer protocol policy.

1. **Deposit period** (2 weeks): Community members deposit LUNC on a proposal until the minimum threshold (currently 50 LUNC) is met.
2. **Voting period** (1 week): Validators vote `Yes`, `No`, `NoWithVeto`, or `Abstain`. Delegators can override their validator’s vote.
3. **Execution**: Passed proposals trigger automatic handlers or human follow-up (for text proposals). Deposits are refunded if quorum (40% participation) and veto thresholds are satisfied.

Common proposal types include parameter changes, community pool spends, and text proposals. See the [governance module spec](../develop/module-specifications/spec-governance) for details.

## Fees and rewards

- **Gas** pays validator compute and storage costs (`x/auth`).
- **Burn tax** is charged via the `x/tax` module on many transfers; rates are queryable through LCD or RPC endpoints.
- **Legacy swap fees** (Tobin and spread) are currently set to 100% to disable utilizing the market module.

Rewards flow into the distribution module and are split between validators and delegators based on stake and commission. Consult the [fees guide](./fees) for live endpoints and tax exemptions.
