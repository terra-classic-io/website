Terra Classic governance allows the community to propose, discuss, fund, and approve changes through transparent on-chain voting. Governance decisions can update network parameters, authorize Community Pool spending, coordinate upgrades, and execute other messages supported by the governance module.

## How Governance Works

1. **Proposal submission.** An account submits a proposal describing the requested change and the messages that should be executed if it passes.
2. **Deposit period.** LUNC deposits are collected until the proposal reaches the minimum deposit required to enter voting.
3. **Voting period.** Bonded LUNC voting power can choose **Yes**, **No**, **No with veto**, or **Abstain**.
4. **Tally and execution.** When voting ends, the chain evaluates quorum, approval, and veto thresholds. Messages attached to a successful proposal are then executed by the governance module.

> **Review the on-chain messages**
>
> A proposal title and description explain its intent, but the attached messages define what the chain will actually execute. Review recipients, amounts, parameters, upgrade plans, and contract addresses before voting.

## Voting Options

| Option | Meaning |
| --- | --- |
| **Yes** | Support the proposal and its attached on-chain actions. |
| **No** | Do not support the proposal. |
| **No with veto** | Reject the proposal and signal that it may be harmful or inappropriate for governance. |
| **Abstain** | Participate in quorum without choosing Yes, No, or No with veto. |

## Voting Power and Delegation

Voting power is associated with bonded LUNC. Validators may vote with the stake delegated to them, while delegators can submit their own vote and override the validator's choice for their delegated voting power. Wallet and explorer interfaces should always display the account, network, and proposal identifier before a vote is signed.

For staking fundamentals, delegation, and validator selection, see [Staking and governance](/docs/learn/staking-and-governance).

## Proposal Lifecycle

Proposal timing and thresholds are chain parameters rather than values maintained by this website. The live panel queries the current governance parameters from public Terra Classic LCD endpoints and displays:

- Proposals in deposit or voting periods.
- Current vote tallies when returned by the chain.
- Recent completed proposals and their final results.
- Voting duration, quorum, approval threshold, veto threshold, and minimum deposit.
- The latest block and refresh time used for the snapshot.

## Participating Safely

- Confirm that the wallet is connected to Terra Classic mainnet and that the proposal ID matches the intended vote.
- Read the complete proposal, discussion links, and every attached message.
- Verify Community Pool recipients and requested amounts independently.
- Treat external links in proposal metadata as untrusted until their destination is verified.
- Review software-upgrade binaries, checksums, heights, and release notes before supporting an upgrade.
- Never share a seed phrase or private key to submit a governance vote.

## Creating a Proposal

Before submitting a proposal:

1. Publish a clear specification and gather community feedback.
2. Describe the problem, expected outcome, risks, alternatives, and implementation plan.
3. Prepare the exact governance messages and test them against the correct network configuration.
4. Explain any Community Pool request with milestones, recipients, amounts, and accountability measures.
5. Confirm the live deposit and voting parameters shown by the chain.

## Governance Resources

- [Validator.info governance explorer](https://validator.info/terra-classic/governance) for proposal browsing and voting information.
- [Terra Classic Core](https://github.com/classic-terra/core) for governance implementation and releases.
- [Governance module specification](/docs/develop/module-specifications/governance) for the technical module reference.
- [Community Pool & Treasury](/docs/learn/treasury) for governed reserves and Community Pool holdings.
- [Staking and governance](/docs/learn/staking-and-governance) for the relationship between delegation and voting power.

## FAQ

### Does this website cast votes?

No. This page is read-only. It displays public on-chain information and links to external governance interfaces where users can review the complete proposal and choose how to participate.

### Why can the active proposal list be empty?

There may be no proposal in a deposit or voting period at that moment. Public LCD endpoints can also be temporarily unavailable or rate-limited; the refresh button retries the configured endpoints.

### Are the displayed thresholds permanent?

No. Governance parameters can change through network upgrades or successful proposals. The live panel displays the values returned by the chain at refresh time.
