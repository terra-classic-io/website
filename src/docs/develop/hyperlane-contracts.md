## Hyperlane contracts and Warp routes

Hyperlane connects Terra Classic with BNB Smart Chain, Ethereum, and Solana. The current Warp routes carry Terra Classic's native LUNC and USTC assets to synthetic representations on the destination networks.

The live security panel above reads validator announcements, checkpoint indexes, and the validator sets configured in the destination ISMs. Human-readable operator names are maintained separately from the on-chain security state.

> **Deployment notice**
>
> The deployment update supplied by the maintainers stated that ownership transfers were still being completed. Treat this notice as active until the corresponding governance and multisignature transactions are publicly linked and verified. Use small amounts only while testing.

## Governance & multisig administration

For current proposals, administrative approvals, and selected live authority reads, open [Hyperlane Governance](/docs/develop/hyperlane/governance). The entries below preserve the original announcement context; consult the dashboard sources for current state.

The maintainer update shared on **September 28, 2026** announced the following accounts for collective administration of the deployment's Interchain Gas Paymaster (IGP) and Interchain Security Module (ISM) contracts on connected networks. It stated that Terra Classic contracts would remain under Terra Classic governance.

**Status: announced accounts; ownership and authority transfers not yet verified for this documentation.** Creating a multisig does not establish that it controls the intended contracts. The exact contracts and administrative powers assigned to each account still need to be confirmed on-chain.

| Network | Administration | Announced account | Approval threshold |
| --- | --- | --- | --- |
| BNB Smart Chain | Safe | `0x4d78A2182a7Cd3a370D73E6651EF4B32C2dd8BDb` — [BscScan](https://bscscan.com/address/0x4d78A2182a7Cd3a370D73E6651EF4B32C2dd8BDb#events) | The supplied creation screenshot shows 4 of 6; current configuration unverified. |
| Ethereum | Safe | `0x4d78A2182a7Cd3a370D73E6651EF4B32C2dd8BDb` — [Etherscan](https://etherscan.io/address/0x4d78A2182a7Cd3a370D73E6651EF4B32C2dd8BDb#events) | Not yet verified. |
| Solana | Squads | `UyvAB4vzpbzUfSQP4uStLPz2Td1coSJcosCRGV4vHmr` — [Solscan](https://solscan.io/account/UyvAB4vzpbzUfSQP4uStLPz2Td1coSJcosCRGV4vHmr) | Not yet verified. |
| Terra Classic | On-chain governance, as announced | Governing authority and transfer transactions not yet verified. | Governed by the applicable proposal process. |

The Ethereum and BNB Smart Chain entries refer to separate accounts on separate networks even though their addresses match. On Solana, the announced address still needs to be identified as a Squads multisig account or vault: the configuration account and the vault that holds assets or authorities have different roles. See [Squads account and vault documentation](https://docs.squads.so/main/navigating-your-squad/settings).

These are administration references, not bridge deposit addresses. Do not send funds to them to initiate a bridge transfer.

### Administrative approvals and message verification

The **ISM signature threshold** in the live security panel governs verification of cross-chain messages. The **multisig approval threshold** governs administrative transactions, such as changes to fee or security settings where the account has authority. These thresholds and their signing addresses are separate and must be verified independently.

The IGP handles payments for relaying messages to destination chains; the ISM verifies incoming cross-chain messages. An operator's validator checkpoint signing address can differ from its Safe or Squads member address. The validator directory above identifies checkpoint signers, not administrative multisig members.

### Transfer verification

Before marking an account as the active administrator, this reference needs links to the executed ownership or authority transfer transactions, the affected contract or program addresses, and the resulting on-chain owners or authorities. Record each account's current members, approval threshold, and verification date alongside those sources. For Terra Classic, include the relevant governance proposal and its executed changes.

Public transfer transaction links and verified contract-to-administrator mappings have not yet been recorded here. The deployment notice remains active until that evidence is available.

## Contract address verification

The core and Warp route contract addresses and token mints in the following sections were last checked against the [Hyperlane Registry](https://github.com/hyperlane-xyz/hyperlane-registry) on **September 3, 2026**. This check does not cover the administrative accounts announced above. Verify the registry and the relevant block explorer before signing a transaction.

## Terra Classic core contracts

These contracts provide the core Hyperlane messaging and validator infrastructure on Terra Classic.

| Component | Address |
| --- | --- |
| Mailbox | `0x4b911a4e9984913279a709a623f2120ba0c0a3967acd026b1301894398a96fed` |
| Interchain Security Module | `0xe5c4262ca68f0f794ec1d1697b7f2632b8474989032b4ab4b16c0aa8216175bc` |
| Interchain Gas Paymaster | `0x5f793ba34a28e104c505896601bef42d414dc20313654fd8cab911b36efe522e` |
| Merkle Tree Hook | `0x3c7e0d10013db710c6b8322dab479e3f0950fc1dbe49a1cf3e9950429db9f8ca` |
| Validator Announce | `0x42e7b6e599b20c160b328b92453f2a9c63446e3be3a5a465bc31ba7d4a26f3f0` |

Verify these values in the registry's [Terra Classic core deployment](https://github.com/hyperlane-xyz/hyperlane-registry/blob/main/chains/terraclassic/addresses.yaml).

## Terra Classic Warp route contracts

LUNC and USTC are native bank-module denominations on Terra Classic, not CW20 tokens. The addresses below are the CosmWasm Hyperlane Warp route contracts that lock and release the native assets.

| Asset | Native denomination | Warp route contract | Explorer |
| --- | --- | --- | --- |
| LUNC | `uluna` | `terra1m7jcqxfn4hd7q4sywhw508nxshaf078c4vh83y0ts43y9tlp9dcs50cggy` | [Terra Finder](https://finder.terraclassic.community/mainnet/address/terra1m7jcqxfn4hd7q4sywhw508nxshaf078c4vh83y0ts43y9tlp9dcs50cggy) |
| USTC | `uusd` | `terra1qu3x6vhk4y6w6erhmedzfp2ug53qm5nwpyarxveqa7tvwg0telxqvd3ccf` | [Terra Finder](https://finder.terraclassic.community/mainnet/address/terra1qu3x6vhk4y6w6erhmedzfp2ug53qm5nwpyarxveqa7tvwg0telxqvd3ccf) |

## LUNC on connected networks

| Network | Token contract or mint | Explorer |
| --- | --- | --- |
| BNB Smart Chain | `0x481095ecEd7A907e7f390b6226F53a66D379e6e2` | [BscScan](https://bscscan.com/token/0x481095eced7a907e7f390b6226f53a66d379e6e2) |
| Ethereum | `0xA4bc47a4C5461eB0E59A585a21A1222EF7544Ac6` | [Etherscan](https://etherscan.io/token/0xa4bc47a4c5461eb0e59a585a21a1222ef7544ac6) |
| Solana | `8dxTo5reLtvRDx3Q8WEP33Uj2C5u6372EygJdNbsLFKG` | [Solscan](https://solscan.io/token/8dxTo5reLtvRDx3Q8WEP33Uj2C5u6372EygJdNbsLFKG) |

The LUNC Solana mint is controlled through the Hyperlane Warp route program `Dd3ajD8WbEyx7z3HqPnDyvUgFqEBzvF1VePjYd1NGnbr`. The mint and Warp route program are different addresses.

## USTC on connected networks

| Network | Token contract or mint | Explorer |
| --- | --- | --- |
| BNB Smart Chain | `0xfC067fd98FD123fC2cAd72d040AF60a523274339` | [BscScan](https://bscscan.com/token/0xfc067fd98fd123fc2cad72d040af60a523274339) |
| Ethereum | `0xf49408beb319aeCe3E8B3550a5C750C19b3F1e51` | [Etherscan](https://etherscan.io/token/0xf49408beb319aece3e8b3550a5c750c19b3f1e51) |
| Solana | `GNUbsF5mrurtDzNc65HipN5Fyzzzqbj5UonLNhj9frjF` | [Solscan](https://solscan.io/token/GNUbsF5mrurtDzNc65HipN5Fyzzzqbj5UonLNhj9frjF) |

The USTC Solana mint is controlled through the Hyperlane Warp route program `7CUdBt1Qn2R2StE7MDPhQW2EhmnGg8zKK8oJXwAGEoyf`. The mint and Warp route program are different addresses.

## Verification sources

- [Terra Classic chain metadata and core contracts](https://github.com/hyperlane-xyz/hyperlane-registry/tree/main/chains/terraclassic)
- [LUNC Warp route configuration](https://github.com/hyperlane-xyz/hyperlane-registry/blob/main/deployments/warp_routes/LUNC/bsc-ethereum-solanamainnet-terraclassic-config.yaml)
- [USTC Warp route configuration](https://github.com/hyperlane-xyz/hyperlane-registry/blob/main/deployments/warp_routes/USTC/bsc-ethereum-solanamainnet-terraclassic-config.yaml)
- [Terra Classic Bridge](https://terraclassic-bridge.xyz/)
- [Terra Classic Bridge Monitor](https://monitor.terraclassic-bridge.xyz/) — operational monitoring of the relayer, operator balances, and validator checkpoints.

For validator infrastructure and operations, continue with [Run a Hyperlane validator](/docs/develop/hyperlane/validator).
