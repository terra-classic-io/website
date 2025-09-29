`x/taxexemption` lets Terra Classic governance define address “zones” that are exempt from the burn tax. Transactions remain taxable by default unless all participants satisfy the zone rules stored in this module.

## Core concepts

- **Zones.** Governance maintains named zones with boolean flags: `incoming`, `outgoing`, and `cross_zone`. These flags describe whether tax-free transfers are allowed into the zone, out of the zone, and across zones.
- **Assignments.** Addresses can be assigned to at most one zone. The exemption check iterates every input/output pair and evaluates sender/recipient zones against the rules above.
- **Full-governance control.** All mutations happen through governance messages (`MsgAddTaxExemptionZone`, `MsgRemoveTaxExemptionZone`, `MsgModifyTaxExemptionZone`, `MsgAddTaxExemptionAddress`, `MsgRemoveTaxExemptionAddress`). No direct user tx bypasses governance safeguards.
- **Integration with `x/tax`.** The tax keeper calls `IsExemptedFromTax()` before deducting burn tax. If any participant fails the zone criteria, the entire transfer is taxed.

## Exemption rules

A transfer is tax free only when **every** (sender, recipient) pair satisfies at least one of the following:

- Sender and recipient share the same zone.
- Sender’s zone has `outgoing` and (`recipient has no zone` or `cross_zone` is true).
- Recipient’s zone has `incoming` and (`sender has no zone` or `cross_zone` is true).
- Cross-zone transfer where either zone has `cross_zone` set and permits the relevant direction.

If any recipient fails the rule set, the whole transaction is taxed.

## State

| Store key | Description |
| --- | --- |
| `ZonePrefix` | Stores serialized zone definitions keyed by zone name. |
| `AddressPrefix` | Maps Bech32 addresses to their assigned zone. |

## Parameters (`subspace`: `taxexemption`)

| Name | Description | Classic default |
| --- | --- | --- |
| `MaxZones` | Upper bound on simultaneously registered zones. | `100` |
| `MaxAddresses` | Maximum total exempt addresses allowed. | `10000` |

Proposals that exceed these caps fail validation.

## Governance workflow

1. Draft a proposal containing one or more `taxexemption` messages (e.g., add zones, update flags, add/remove addresses).
2. Submit via `terrad tx gov submit-proposal draft.json` and deposit the required LUNC.
3. Once passed, the keeper updates stores atomically; future transactions immediately honour the new exemption set.

## Queries & CLI

- **Zones:** `terrad q taxexemption zones`
- **Zone addresses:** `terrad q taxexemption addresses <zone>`
- **Taxable check:** `terrad q taxexemption taxable <from> <to>`
