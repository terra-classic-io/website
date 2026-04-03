## Transaction best practices

Terra Classic follows standard Cosmos transaction flows, but several chain-specific rules affect how applications should build, simulate, and broadcast transactions.

This guide focuses on the behaviours that most often surprise integrators on Classic mainnet (`columbus-5`) and testnet (`rebel-2`).

## What is specific to Terra Classic?

When integrating with Terra Classic, keep these points in mind:

- transfers can be affected by the burn tax
- tax handling can vary depending on current Tax2Gas rules and governance changes
- some addresses and zones are exempt from burn tax
- legacy market swap paths remain disabled on Classic
- public infrastructure is suitable for development, not heavy production workloads

Before assuming fee or transfer behaviour, always verify the current on-chain parameters.

## Network access

Terra Classic integrations usually rely on:

- LCD for REST queries and tax-related lookups
- RPC for chain state, CometBFT queries, and wallet-backed transaction flows
- FCD for convenience endpoints such as suggested gas prices
- gRPC for typed service integrations and backend tooling

Use the maintained endpoint list here: [/docs/develop/endpoints](/docs/develop/endpoints)

## Optional preflight checks

A production-grade integration may query live chain data before building transactions when the app needs precise fee previews, sender-side tax handling, or received-amount estimates.

Useful preflight checks include:

- tax parameters from the LCD API
- burn tax rate from the LCD API
- tax exemption registry lookups from the LCD API
- suggested gas prices from the FCD gas price endpoint

See the exact endpoints in [/docs/develop/endpoints](/docs/develop/endpoints).

Typical optional checks:

1. Fetch current gas prices.
2. Fetch current tax parameters.
3. Check whether sender and recipient are taxable when the UX depends on it.
4. Simulate the transaction when the app needs a tighter estimate.
5. Broadcast only after confirming final fee assumptions.

## Burn tax and Tax2Gas

Terra Classic applies burn tax through the `x/tax` flow on taxable transfers.

Important consequences for integrators:

- the amount received by the destination may differ from the amount the sender intended to transfer
- in some paths, tax can be charged through reverse-charge handling rather than simple top-level deduction
- wallet UIs and backend services should not hardcode a single tax formula
- governance changes can alter practical fee behaviour without requiring application code changes

For many basic transfers, apps do not need to query taxability before broadcasting because the tax is automatically deducted on-chain. Preflight checks are mainly useful when the app wants to show the effect on the received amount or intentionally handle the tax on the sender side.

If your app shows transfer previews, present the result as an estimate unless you have just simulated against current chain state.

See also: [/docs/learn/fees](/docs/learn/fees)

## Tax exemption support

Some accounts or zones can be exempt from burn tax.

This matters for:

- exchange and custody flows
- treasury operations
- contract-controlled transfers
- internal service wallets

Before treating a transfer as taxable in the UI, query the tax exemption registry through the LCD API.

If your app shows fee or received-amount estimates, this check should happen before the final confirmation screen.

For the current registry endpoints and examples, see the [Tax exemption registry](/docs/learn/fees#tax-exemption-registry) section in the fees guide.

## Contract calls with funds

Sending funds to a contract is tax-free on Terra Classic.

That means contract execution flows should not be treated the same way as standard taxable wallet-to-wallet transfers when calculating expected outcomes in the UI.

## Disabled market swap behaviour

Classic still exposes historical module concepts related to swaps, spreads, and Tobin tax, but the original market swap path is disabled.

Do not build new application flows that depend on:

- native market module swap UX from legacy Terra
- algorithmic LUNC-stable swap assumptions
- old economic behaviour described in pre-collapse Terra materials

For asset exchange, rely on currently active dApps and liquidity venues instead of legacy protocol swap expectations.

## Suggested transaction flow

A safe integration flow looks like this:

1. Resolve network and transport choice from configuration.
2. Fetch current gas prices.
3. Optionally fetch tax parameters when the app needs them for UX or accounting.
4. Optionally check taxability for the sender and recipient when relevant.
5. Build the unsigned transaction.
6. Simulate gas usage when the app needs a tighter estimate.
7. Apply a gas adjustment margin.
8. Show the user the final estimated cost.
9. Broadcast the transaction.
10. Poll or subscribe for confirmation.

## Frontend integration guidance

Frontend apps should:

- keep chain ID explicit (`columbus-5` or `rebel-2`)
- separate display amounts from micro-denom on-chain amounts
- avoid assuming fixed gas prices
- avoid assuming all `MsgSend` flows are taxed identically
- treat contract calls with attached funds separately from taxable wallet-to-wallet sends
- handle wallet rejection and broadcast failure separately

A useful UX pattern is:

- preflight fetch
- simulation
- confirmation modal
- broadcast
- confirmation tracking by tx hash

## Backend integration guidance

Backend services should:

- avoid depending on a single public endpoint
- use retries with backoff for LCD and RPC queries
- prefer dedicated infrastructure for production
- record both requested transfer amount and actual on-chain result
- distinguish taxable transfers from tax-free contract funding flows
- persist tx hash, code, raw log, and gas used for debugging

If you operate automated jobs, add alerts for:

- sudden gas price changes
- changed burn tax parameters
- endpoint instability
- repeated out-of-gas or insufficient-fee failures

## Common mistakes

### Hardcoding gas prices

Gas prices should be refreshed from a live source instead of being baked into code indefinitely.

### Assuming every transfer needs a tax preflight

Basic transfers do not require an explicit tax query to succeed. Preflight checks are mostly for UX precision and accounting.

### Ignoring tax exemption routes

Two transfers with the same amount can behave differently depending on sender and recipient exemption status.

### Treating legacy swap docs as active behaviour

Old Terra documentation often describes protocol flows that do not reflect current Classic behaviour.

### Skipping simulation

Broadcasting without simulation increases the chance of underpriced or failed transactions.

### Trusting public infrastructure for production

Public nodes are fine for development, but production systems should run their own infrastructure or use a dedicated provider.

## Troubleshooting checklist

If a transaction fails unexpectedly:

- confirm the chain ID
- verify account sequence and wallet state
- refresh gas prices
- re-check tax parameters
- check sender and recipient taxability if the UX or accounting depends on it
- simulate again
- inspect tx logs and error codes
- retry against another healthy endpoint

## Related docs

- [/docs/develop/endpoints](/docs/develop/endpoints)
- [/docs/learn/fees](/docs/learn/fees)
- [/docs/develop/module-specifications/auth](/docs/develop/module-specifications/auth)
- [/docs/develop/module-specifications/taxexemption](/docs/develop/module-specifications/taxexemption)
- [/docs/develop/module-specifications/feegrant](/docs/develop/module-specifications/feegrant)
