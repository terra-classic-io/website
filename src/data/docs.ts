import type { DocPage } from "../types/doc-page";
import type { DocSection } from "../types/doc-section";
import startGuide from "../docs/start.md?raw";
import buildTerraCoreGuide from "../docs/full-node/run-a-full-terra-node/build-terra-core.md?raw";
import configureGeneralSettingsGuide from "../docs/full-node/run-a-full-terra-node/configure-general-settings.md?raw";
import endpointsGuide from "../docs/develop/endpoints.md?raw";
import joinNetworkGuide from "../docs/full-node/run-a-full-terra-node/join-a-network.md?raw";
import setUpProductionGuide from "../docs/full-node/run-a-full-terra-node/set-up-production.md?raw";
import syncGuide from "../docs/full-node/run-a-full-terra-node/sync.md?raw";
import systemConfigGuide from "../docs/full-node/run-a-full-terra-node/system-config.md?raw";
import troubleshootGuide from "../docs/full-node/run-a-full-terra-node/troubleshoot.md?raw";
import validatorColumbus5Guide from "../docs/full-node/run-a-full-terra-node/validator-columbus-5.md?raw";
import validatorRebel2Guide from "../docs/full-node/run-a-full-terra-node/validator-rebel-2.md?raw";
import fullNodeOverviewGuide from "../docs/full-node/overview.md?raw";
import localnetGuide from "../docs/develop/how-to/localnet/terra-core-localnet.md?raw";
import keplrOverviewGuide from "../docs/learn/keplr/keplr.md?raw";
import keplrInstallGuide from "../docs/learn/keplr/keplr-install.md?raw";
import keplrWalletGuide from "../docs/learn/keplr/keplr-wallet.md?raw";
import keplrSendGuide from "../docs/learn/keplr/keplr-send.md?raw";
import keplrStakingGuide from "../docs/learn/keplr/keplr-staking.md?raw";
import keplrGovernanceGuide from "../docs/learn/keplr/keplr-governance.md?raw";
import keplrTestnetGuide from "../docs/learn/keplr/keplr-testnet.md?raw";
import galaxyStationOverviewGuide from "../docs/learn/galaxy-station/galaxy-station.md?raw";
import galaxyStationInstallGuide from "../docs/learn/galaxy-station/galaxy-station-install.md?raw";
import galaxyStationWalletGuide from "../docs/learn/galaxy-station/galaxy-station-wallet.md?raw";
import galaxyStationSendGuide from "../docs/learn/galaxy-station/galaxy-station-send.md?raw";
import galaxyStationStakingGuide from "../docs/learn/galaxy-station/galaxy-station-staking.md?raw";
import galaxyStationGovernanceGuide from "../docs/learn/galaxy-station/galaxy-station-governance.md?raw";
import learnProtocolGuide from "../docs/learn/protocol.md?raw";
import learnFeesGuide from "../docs/learn/fees.md?raw";
import learnGlossaryGuide from "../docs/learn/glossary.md?raw";
import learnAssetsGuide from "../docs/learn/assets.md?raw";
import cosmesOverviewGuide from "../docs/develop/cosmes/cosmes.md?raw";
import cosmesGettingStartedGuide from "../docs/develop/cosmes/cosmes-getting-started.md?raw";
import cosmesQueryDataGuide from "../docs/develop/cosmes/cosmes-query-data.md?raw";
import cosmesMnemonicWalletGuide from "../docs/develop/cosmes/cosmes-mnemonic-wallet.md?raw";
import cosmesTransactionsGuide from "../docs/develop/cosmes/cosmes-transactions.md?raw";
import terraPyGuide from "../docs/develop/terra-py/terra-py.md?raw";
import learnOverviewGuide from "../docs/learn/overview.md?raw";
import learnWalletsGuide from "../docs/learn/wallets.md?raw";
import learnStakingGuide from "../docs/learn/staking-and-governance.md?raw";
import learnBuilderGuide from "../docs/learn/builder-tooling.md?raw";
import moduleSpecificationsGuide from "../docs/develop/module-specifications/module-specifications.md?raw";
import specAuthGuide from "../docs/develop/module-specifications/spec-auth.md?raw";
import specAuthzGuide from "../docs/develop/module-specifications/spec-authz.md?raw";
import specBankGuide from "../docs/develop/module-specifications/spec-bank.md?raw";
import specCapabilityGuide from "../docs/develop/module-specifications/spec-capability.md?raw";
import specConsensusGuide from "../docs/develop/module-specifications/spec-consensus.md?raw";
import specCrisisGuide from "../docs/develop/module-specifications/spec-crisis.md?raw";
import specDistributionGuide from "../docs/develop/module-specifications/spec-distribution.md?raw";
import specDyncommGuide from "../docs/develop/module-specifications/spec-dyncomm.md?raw";
import specEvidenceGuide from "../docs/develop/module-specifications/spec-evidence.md?raw";
import specFeegrantGuide from "../docs/develop/module-specifications/spec-feegrant.md?raw";
import specGovernanceGuide from "../docs/develop/module-specifications/spec-governance.md?raw";
import specIbcGuide from "../docs/develop/module-specifications/spec-ibc.md?raw";
import specIbcFeeGuide from "../docs/develop/module-specifications/spec-ibc-fee.md?raw";
import specIbcHooksGuide from "../docs/develop/module-specifications/spec-ibc-hooks.md?raw";
import specIcaGuide from "../docs/develop/module-specifications/spec-ica.md?raw";
import specMarketGuide from "../docs/develop/module-specifications/spec-market.md?raw";
import specMintGuide from "../docs/develop/module-specifications/spec-mint.md?raw";
import specOracleGuide from "../docs/develop/module-specifications/spec-oracle.md?raw";
import specParamsGuide from "../docs/develop/module-specifications/spec-params.md?raw";
import specSlashingGuide from "../docs/develop/module-specifications/spec-slashing.md?raw";
import specStakingGuide from "../docs/develop/module-specifications/spec-staking.md?raw";
import specTaxGuide from "../docs/develop/module-specifications/spec-tax.md?raw";
import specTaxExemptionGuide from "../docs/develop/module-specifications/spec-taxexemption.md?raw";
import specTransferGuide from "../docs/develop/module-specifications/spec-transfer.md?raw";
import specTreasuryGuide from "../docs/develop/module-specifications/spec-treasury.md?raw";
import specUpgradeGuide from "../docs/develop/module-specifications/spec-upgrade.md?raw";
import specVestingGuide from "../docs/develop/module-specifications/spec-vesting.md?raw";
import specWasmGuide from "../docs/develop/module-specifications/spec-wasm.md?raw";
import smartContractsOverviewGuide from "../docs/develop/smart-contracts/README.md?raw";
import smartContractsBuildGuide from "../docs/develop/smart-contracts/build-terra-dapp.md?raw";
import smartContractsSetupGuide from "../docs/develop/smart-contracts/set-up-local-environment.md?raw";
import smartContractsWriteGuide from "../docs/develop/smart-contracts/write-smart-contract.md?raw";
import smartContractsInteractGuide from "../docs/develop/smart-contracts/interact-with-smart-contract.md?raw";
import smartContractsManageCw20Guide from "../docs/develop/smart-contracts/manage-cw20-tokens.md?raw";

const systemConfiguration: DocPage = {
  slug: "system-configuration",
  title: "System configuration",
  summary: "Hardware, OS, and networking prerequisites pulled from the Classic runbook.",
  markdown: systemConfigGuide,
};

const startPage: DocPage = {
  slug: "start",
  title: "Terra Classic Documentation",
  summary: "Pick the right Terra Classic docs for operators, builders, or community members.",
  markdown: startGuide,
};

const buildTerraCore: DocPage = {
  slug: "build-terra-core",
  title: "Build Terra core",
  summary: "Fetch and compile the latest Terra Classic binaries from source.",
  markdown: buildTerraCoreGuide,
};

const configureGeneralSettings: DocPage = {
  slug: "configure-general-settings",
  title: "Configure general settings",
  summary: "This guide covers the most important configuration files found in `~/.terra/config/`. Review each file and update the defaults to match your infrastructure.",
  markdown: configureGeneralSettingsGuide,
};

const setUpProduction: DocPage = {
  slug: "set-up-production",
  title: "Set up a production environment",
  summary: "Use this checklist to prepare a production-grade Terra Classic node.",
  markdown: setUpProductionGuide,
};

const joinNetwork: DocPage = {
  slug: "join-a-network",
  title: "Join a network",
  summary: "Use this overview to choose the right walkthrough for connecting a Terra Classic node to the network.",
  markdown: joinNetworkGuide,
};

const syncNode: DocPage = {
  slug: "sync",
  title: "Sync",
  summary: "Snapshots, manual replay, and verification steps.",
  markdown: syncGuide,
};

const troubleshootNode: DocPage = {
  slug: "troubleshoot",
  title: "Reset and troubleshooting",
  summary: "Recover from configuration drift, replace genesis files, and verify node health.",
  markdown: troubleshootGuide,
};

const validatorColumbus5: DocPage = {
  slug: "validator-columbus-5",
  title: "Validate on columbus-5",
  summary: "End-to-end instructions for running a Terra Classic mainnet validator.",
  markdown: validatorColumbus5Guide,
};

const validatorRebel2: DocPage = {
  slug: "validator-rebel-2",
  title: "Validate on rebel-2",
  summary: "Spin up a Terra Classic testnet validator and join coordination channels.",
  markdown: validatorRebel2Guide,
};

const fullNodeRunbookPages: readonly DocPage[] = [
  systemConfiguration,
  buildTerraCore,
  configureGeneralSettings,
  setUpProduction,
  joinNetwork,
  syncNode,
  validatorColumbus5,
  validatorRebel2,
  troubleshootNode,
];

const fullNodeOverview: DocPage = {
  slug: "overview",
  title: "Overview",
  summary:
    "Understand hardware expectations, supported platforms, and the lifecycle of running a Terra Classic node.",
  markdown: fullNodeOverviewGuide,
  children: fullNodeRunbookPages,
};

const fullNodeEndpoints: DocPage = {
  slug: "network-endpoints",
  title: "Public Network Endpoints",
  summary: "Public endpoints for Terra Classic infrastructure.",
  markdown: endpointsGuide,
};

const learnOverview: DocPage = {
  slug: "overview",
  title: "Start here",
  summary: "High-level walkthrough of the Terra Classic protocol, token utility, and where to dive deeper.",
  markdown: learnOverviewGuide,
};

const learnProtocol: DocPage = {
  slug: "protocol",
  title: "Terra Classic protocol",
  summary: "How Terra Classic stablecoins, LUNC, staking, and governance interconnect.",
  markdown: learnProtocolGuide,
};

const learnFees: DocPage = {
  slug: "fees",
  title: "Fees",
  summary: "Understand gas, burn tax, and legacy swap fees on Terra Classic.",
  markdown: learnFeesGuide,
};

const learnGlossary: DocPage = {
  slug: "glossary",
  title: "Glossary",
  summary: "Terra Classic terminology reference for users, validators, and developers.",
  markdown: learnGlossaryGuide,
};

const learnAssets: DocPage = {
  slug: "assets",
  title: "Brand assets",
  summary: "Download Terra Classic logo assets for integrations and documentation.",
  markdown: learnAssetsGuide,
};

const learnWallets: DocPage = {
  slug: "wallets",
  title: "Wallets",
  summary:
    "Pick a trusted wallet to manage LUNC, delegate, and interact with dApps without highlighting legacy Station interfaces.",
  markdown: learnWalletsGuide,
  children: [
    {
      slug: "keplr",
      title: "Keplr",
      summary: "Install Keplr and access the core guides for Terra Classic users.",
      markdown: keplrOverviewGuide,
      children: [
        {
          slug: "install",
          title: "Install Keplr",
          summary: "Install Keplr in Chrome, Brave, or Firefox.",
          markdown: keplrInstallGuide,
        },
        {
          slug: "wallet",
          title: "Create or import wallet",
          summary: "Set up a new Keplr account or import Station mnemonics.",
          markdown: keplrWalletGuide,
        },
        {
          slug: "send",
          title: "Send tokens",
          summary: "Send assets with Keplr on Terra Classic.",
          markdown: keplrSendGuide,
        },
        {
          slug: "staking",
          title: "Stake with Keplr",
          summary: "Delegate, redelegate, and undelegate LUNC with Keplr.",
          markdown: keplrStakingGuide,
        },
        {
          slug: "governance",
          title: "Governance",
          summary: "Deposit and vote on proposals using Keplr.",
          markdown: keplrGovernanceGuide,
        },
        {
          slug: "testnet",
          title: "rebel-2 testnet",
          summary: "Use Keplr on the rebel-2 testnet and request faucet funds.",
          markdown: keplrTestnetGuide,
        },
      ],
    },
    {
      slug: "galaxy-station",
      title: "Galaxy Station",
      summary: "Install Galaxy Station (Hexxagon) and manage Terra Classic accounts.",
      markdown: galaxyStationOverviewGuide,
      children: [
        {
          slug: "install",
          title: "Install Galaxy Station",
          summary: "Install the extension on Chrome, Brave, or Firefox.",
          markdown: galaxyStationInstallGuide,
        },
        {
          slug: "wallet",
          title: "Create or import wallet",
          summary: "Set up new accounts or import Station mnemonics.",
          markdown: galaxyStationWalletGuide,
        },
        {
          slug: "send",
          title: "Send tokens",
          summary: "Transfer assets using Galaxy Station or WalletConnect.",
          markdown: galaxyStationSendGuide,
        },
        {
          slug: "staking",
          title: "Stake with Galaxy Station",
          summary: "Delegate, redelegate, and undelegate LUNC in Galaxy Station.",
          markdown: galaxyStationStakingGuide,
        },
        {
          slug: "governance",
          title: "Governance",
          summary: "Deposit and vote on proposals via Galaxy Station.",
          markdown: galaxyStationGovernanceGuide,
        },
      ],
    },
  ],
};

const learnStaking: DocPage = {
  slug: "staking-and-governance",
  title: "Staking and governance",
  summary: "How validator economics, rewards, and voting power align the Terra Classic network.",
  markdown: learnStakingGuide,
};

const developBuilderTooling: DocPage = {
  slug: "builder-tooling",
  title: "Builder tooling",
  summary: "Essential SDKs and references for building Terra Classic dApps with modern tooling.",
  markdown: learnBuilderGuide,
  children: [
    {
      slug: "cosmes",
      title: "CosmES SDK",
      summary: "Use @goblinhunt/cosmes for Terra Classic TypeScript apps.",
      markdown: cosmesOverviewGuide,
      children: [
        {
          slug: "getting-started",
          title: "Get started",
          summary: "Install the SDK, configure TypeScript, and connect wallets.",
          markdown: cosmesGettingStartedGuide,
        },
        {
          slug: "query-data",
          title: "Query data",
          summary: "Read balances and contract state via CosmES client helpers.",
          markdown: cosmesQueryDataGuide,
        },
        {
          slug: "mnemonic-wallet",
          title: "Programmatic wallet",
          summary: "Use `MnemonicWallet` to sign transactions from backends or scripts.",
          markdown: cosmesMnemonicWalletGuide,
        },
        {
          slug: "transactions",
          title: "Transactions",
          summary: "Compose and broadcast Common Terra Classic messages.",
          markdown: cosmesTransactionsGuide,
        },
      ],
    },
    {
      slug: "terra-py",
      title: "Terra.py on Terra Classic",
      summary: "Install terra_sdk, connect to trusted endpoints, and broadcast Python transactions.",
      markdown: terraPyGuide,
    },
  ],
};

const developLocalnet: DocPage = {
  slug: "terra-core-localnet",
  title: "Run Terra Classic localnet",
  summary: "Spin up a multi-validator Terra Classic Core network locally with `make localnet-start`.",
  markdown: localnetGuide,
};

const developModuleSpecifications: DocPage = {
  slug: "module-specifications",
  title: "Module specifications",
  summary: "Explore Terra Classic Core modules, parameters, and Classic-specific behaviour.",
  markdown: moduleSpecificationsGuide,
  children: [
    {
      slug: "auth",
      title: "Auth module (x/auth)",
      summary: "Ante handler, vesting accounts, and transaction gas parameters.",
      markdown: specAuthGuide,
    },
    {
      slug: "authz",
      title: "Authz module (x/authz)",
      summary: "Delegate message execution permissions with fine-grained controls.",
      markdown: specAuthzGuide,
    },
    {
      slug: "bank",
      title: "Bank module (x/bank)",
      summary: "Account balances, token transfers, and supply tracking.",
      markdown: specBankGuide,
    },
    {
      slug: "capability",
      title: "Capability module (x/capability)",
      summary: "Capability keeper for isolating inter-module access rights.",
      markdown: specCapabilityGuide,
    },
    {
      slug: "consensus",
      title: "Consensus params module (x/consensus)",
      summary: "Governance-controlled Tendermint parameter updates.",
      markdown: specConsensusGuide,
    },
    {
      slug: "crisis",
      title: "Crisis module (x/crisis)",
      summary: "Invariant checks and chain-halting safeguards.",
      markdown: specCrisisGuide,
    },
    {
      slug: "distribution",
      title: "Distribution module (x/distribution)",
      summary: "Reward distribution to validators, delegators, and the community pool.",
      markdown: specDistributionGuide,
    },
    {
      slug: "dyncomm",
      title: "DynComm module (x/dyncomm)",
      summary: "Dynamic validator commission band control for Classic staking.",
      markdown: specDyncommGuide,
    },
    {
      slug: "evidence",
      title: "Evidence module (x/evidence)",
      summary: "Evidence handling for consensus faults and slashing workflows.",
      markdown: specEvidenceGuide,
    },
    {
      slug: "feegrant",
      title: "Feegrant module (x/feegrant)",
      summary: "Allow trusted accounts to pay fees on behalf of other users.",
      markdown: specFeegrantGuide,
    },
    {
      slug: "governance",
      title: "Governance module (x/gov)",
      summary: "Proposal lifecycle, deposits, voting, and parameter control.",
      markdown: specGovernanceGuide,
    },
    {
      slug: "ibc",
      title: "IBC core module (x/ibc)",
      summary: "IBC routing, channel management, and light client integration.",
      markdown: specIbcGuide,
    },
    {
      slug: "ibc-fee",
      title: "IBC fee module (x/ibc-fee)",
      summary: "ICS-29 relayer incentivisation for Classic IBC packets.",
      markdown: specIbcFeeGuide,
    },
    {
      slug: "ibc-hooks",
      title: "IBC hooks module (ibc-hooks)",
      summary: "Middleware for wasm contract callbacks on IBC transfers.",
      markdown: specIbcHooksGuide,
    },
    {
      slug: "ica",
      title: "Interchain accounts module (x/ica)",
      summary: "ICS-27 controller and host support on Terra Classic.",
      markdown: specIcaGuide,
    },
    {
      slug: "market",
      title: "Market module (x/market)",
      summary: "Historical swap mechanics and constant-product spread logic.",
      markdown: specMarketGuide,
    },
    {
      slug: "mint",
      title: "Mint module (x/mint)",
      summary: "Inflation schedule and distribution handling (legacy on Classic).",
      markdown: specMintGuide,
    },
    {
      slug: "oracle",
      title: "Oracle module (x/oracle)",
      summary: "Exchange-rate voting, reward weighting, and oracle slashing.",
      markdown: specOracleGuide,
    },
    {
      slug: "params",
      title: "Params module (x/params)",
      summary: "Parameter subspace management across modules.",
      markdown: specParamsGuide,
    },
    {
      slug: "slashing",
      title: "Slashing module (x/slashing)",
      summary: "Downtime and double-signing penalties.",
      markdown: specSlashingGuide,
    },
    {
      slug: "staking",
      title: "Staking module (x/staking)",
      summary: "Validator set management, delegation, and bonding.",
      markdown: specStakingGuide,
    },
    {
      slug: "tax",
      title: "Tax module (x/tax)",
      summary: "Burn tax collection, splits, and effective gas price handling.",
      markdown: specTaxGuide,
    },
    {
      slug: "taxexemption",
      title: "Tax exemption module (x/taxexemption)",
      summary: "Manage burn-tax exempt address lists for Classic.",
      markdown: specTaxExemptionGuide,
    },
    {
      slug: "treasury",
      title: "Treasury module (x/treasury)",
      summary: "Epoch-based tax rate, reward weight, and seigniorage handling.",
      markdown: specTreasuryGuide,
    },
    {
      slug: "transfer",
      title: "IBC transfer module (x/transfer)",
      summary: "ICS-20 fungible token relay with tax integration.",
      markdown: specTransferGuide,
    },
    {
      slug: "upgrade",
      title: "Upgrade module (x/upgrade)",
      summary: "Coordinated chain upgrades and store migrations.",
      markdown: specUpgradeGuide,
    },
    {
      slug: "vesting",
      title: "Vesting module (x/vesting)",
      summary: "Legacy vesting account types preserved on Classic.",
      markdown: specVestingGuide,
    },
    {
      slug: "wasm",
      title: "Wasm module (x/wasm)",
      summary: "CosmWasm contract execution, message bindings, and migrations.",
      markdown: specWasmGuide,
    },
  ],
};

const developSmartContracts: DocPage = {
  slug: "smart-contracts",
  title: "Smart contracts",
  summary: "End-to-end tutorials for building and deploying CosmWasm dApps on Terra Classic.",
  markdown: smartContractsOverviewGuide,
  children: [
    {
      slug: "build-terra-dapp",
      title: "Build a Terra Classic dApp",
      summary: "Overview of the CosmWasm template workflow from idea to deployment.",
      markdown: smartContractsBuildGuide,
    },
    {
      slug: "set-up-local-environment",
      title: "Set up local environment",
      summary: "Install toolchains and prepare LocalTerra for contract development.",
      markdown: smartContractsSetupGuide,
    },
    {
      slug: "write-smart-contract",
      title: "Write smart contract",
      summary: "Author and test CosmWasm contracts with entry points and state management.",
      markdown: smartContractsWriteGuide,
    },
    {
      slug: "interact-with-smart-contract",
      title: "Interact with contracts",
      summary: "Store, instantiate, execute, and query contracts using `terrad`.",
      markdown: smartContractsInteractGuide,
    },
    {
      slug: "manage-cw20-tokens",
      title: "Manage CW20 tokens",
      summary: "Deploy and operate CW20 token contracts on Terra Classic.",
      markdown: smartContractsManageCw20Guide,
    },
  ],
};

export const docSections: readonly DocSection[] = [
  {
    slug: "start",
    title: "Welcome",
    description: "Choose your Terra Classic path with quick links for operators, builders, and learners.",
    pages: [startPage],
  },
  {
    slug: "full-node",
    title: "Run a full node",
    description:
      "Provision, sync, and operate Terra Classic full nodes with production-grade observability and security.",
    pages: [fullNodeOverview, fullNodeEndpoints],
  },
  {
    slug: "develop",
    title: "Develop",
    description: "Build Terra Classic dApps, run localnets, and reference Terra Core modules.",
    pages: [developLocalnet, developBuilderTooling, developSmartContracts, developModuleSpecifications],
  },
  {
    slug: "learn",
    title: "Learn Terra Classic",
    description: "Explore protocol fundamentals, wallet onboarding, staking, and ecosystem terminology.",
    pages: [
      learnOverview,
      learnProtocol,
      learnWallets,
      learnStaking,
      learnFees,
      learnGlossary,
      learnAssets,
    ],
  },
];

export default docSections;
