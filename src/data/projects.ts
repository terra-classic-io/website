export interface ProjectLink {
  name: string;
  url: string;
  description?: string;
}

export interface Category {
  title: string;
  description?: string;
  count?: number;
  links: ProjectLink[];
}

export const categories: Category[] = [
  {
    title: 'For developers',
    count: 14,
    description: 'Resources and tools for developers building on Terra Classic',
    links: [
      { name: 'Documentation', url: 'https://docs.terra.money', description: 'WIP' },
      { name: 'Endpoints - LCD - BiNodes', url: 'https://endpoints.terraclassic.community', description: 'RPC Endpoint' },
      { name: 'Endpoints - LCD - Hexxagon', url: 'https://lcd-terra.hexxagon.io', description: 'RPC Endpoint' },
      { name: 'Endpoints - LCD - Public Node', url: 'https://terra-classic-lcd.publicnode.com', description: 'RPC Endpoint' },
      { name: 'Endpoints - RPC - BiNodes', url: 'https://rpc-terra-classic.bisonai.com', description: 'RPC Endpoint' },
      { name: 'Endpoints - RPC - Hexxagon', url: 'https://rpc-terra.hexxagon.io', description: 'RPC Endpoint' },
      { name: 'Endpoints - RPC - Public Node', url: 'https://terra-classic-rpc.publicnode.com', description: 'RPC Endpoint' },
      { name: 'Endpoints - FDC - Hexxagon', url: 'https://fcd-terra.hexxagon.io', description: 'RPC Endpoint' },
      { name: 'Endpoints - FDC - Public Node', url: 'https://terra-classic-fcd.publicnode.com', description: 'RPC Endpoint' },
      { name: 'Endpoints - GRPC - Hexxagon', url: 'https://grpc-terra.hexxagon.io', description: 'RPC Endpoint' },
      { name: 'Endpoints - HIVE - Hexxagon', url: 'https://hive-terra.hexxagon.io', description: 'RPC Endpoint' },
      { name: 'Endpoints - API - Hexxagon', url: 'https://api-terra.hexxagon.io', description: 'RPC Endpoint' },
      { name: 'GitHub', url: 'https://github.com/terra-money', description: 'Code Repository' },
      { name: 'Node snapshots', url: 'https://snapshots.terraclassic.community', description: 'Sync Tool' }
    ]
  },
  {
    title: 'Infrastructure & service providers',
    count: 5,
    description: 'Critical infrastructure services for the Terra Classic network',
    links: [
      { name: 'Allnodes', url: 'https://www.allnodes.com/lunc/staking', description: 'Non-custodial node hosting' },
      { name: 'CHALLENGE Studio', url: 'https://challenge.studio', description: 'Web3 design & dev' },
      { name: 'Hexxagon', url: 'https://hexxagon.io', description: 'Validator hosting' },
      { name: 'Nownodes', url: 'https://nownodes.io', description: 'Blockchain RPC API' },
      { name: 'Stakin.com', url: 'https://stakin.com', description: 'Dedicated nodes' }
    ]
  },
  {
    title: 'Blockchain tools',
    count: 17,
    description: 'Tools for interacting with and analyzing the Terra Classic blockchain',
    links: [
      { name: 'ATOMScan', url: 'https://atomscan.com/terra-luna-classic', description: 'Analytics' },
      { name: 'CW-20 Bakery', url: 'https://github.com/terra-money/cw20-bakery', description: 'Burn tool' },
      { name: 'DAO DAO', url: 'https://daodao.zone', description: 'DAO tooling' },
      { name: 'Galaxy Finder', url: 'https://findergalaxy.com', description: 'Finder' },
      { name: 'LUNC Burner', url: 'https://luncburner.io', description: 'Analytics' },
      { name: 'LUNCdash', url: 'https://luncdash.com', description: 'Analytics' },
      { name: 'LUNCdash Finder', url: 'https://finder.luncdash.com', description: 'Finder' },
      { name: 'LUNC Metrics', url: 'https://lunc-metrics.com', description: 'Analytics' },
      { name: 'LuncScan', url: 'https://luncscan.io', description: 'Analytics' },
      { name: 'Lunc.Tools', url: 'https://lunc.tools', description: 'Analytics' },
      { name: 'MoonRunners', url: 'https://moonrunners.io', description: 'Analytics' },
      { name: 'Ping.pub', url: 'https://ping.pub/terra-luna-classic', description: 'Analytics' },
      { name: 'StakeBin', url: 'https://stakebin.io/terra-luna-classic', description: 'Analytics' },
      { name: 'Terra Finder', url: 'https://finder.terraclassic.community', description: 'Finder' },
      { name: 'Terraport Finder', url: 'https://finder.terraport.network', description: 'Finder' },
      { name: 'TrackTerra', url: 'https://trackterra.org', description: 'Explorer' },
      { name: 'Validator.info', url: 'https://validator.info', description: 'Analytics' }
    ]
  },
  {
    title: 'Bridges',
    count: 6,
    description: 'Cross-chain bridges connecting Terra Classic to other blockchains',
    links: [
      { name: 'IBC Eureka', url: 'https://eureka.terra.dev', description: 'IBC Bridge' },
      { name: 'Juris Bridge', url: 'https://juris.network/bridge', description: 'Cross-chain Bridge' },
      { name: 'Satellite', url: 'https://www.satellite.money', description: 'IBC Bridge' },
      { name: 'Terraport Bridge', url: 'https://terraport.network/bridge', description: 'Cross-chain Bridge' },
      { name: 'TFM', url: 'https://tfm.com/bridge', description: 'IBC Bridge' },
      { name: 'Tritium Bridge', url: 'https://tritium.network/bridge', description: 'Cross-chain Bridge' }
    ]
  },
  {
    title: 'Validators',
    count: 3,
    description: 'Validator communities and resources',
    links: [
      { name: 'Validator.Info', url: 'https://validator.info', description: 'Validator Info' },
      { name: 'Validators Discord group', url: 'https://discord.gg/terra-validators', description: 'Community Chat' },
      { name: 'Validators Telegram group', url: 'https://t.me/TerraValidators', description: 'Community Chat' }
    ]
  },
  {
    title: 'Entertainment',
    count: 10,
    description: 'Games and entertainment platforms built on Terra Classic',
    links: [
      { name: 'Air Force Lunc', url: 'https://airforcelunc.io', description: 'Game' },
      { name: 'Galactic Shift', url: 'https://galacticshift.io', description: 'Game WIP' },
      { name: 'Garuda The Protector', url: 'https://garuda.game', description: 'Game' },
      { name: 'Legends of Terratria', url: 'https://legendsofterratria.com', description: 'Game WIP' },
      { name: 'Lunc Zombie', url: 'https://lunczombie.io', description: 'Game' },
      { name: 'Luncvers3', url: 'https://luncvers3.io', description: 'Metaverse' },
      { name: 'MIOFF', url: 'https://mioff.io', description: 'Festival' },
      { name: 'PENGS', url: 'https://pengs.io', description: 'Game WIP' },
      { name: 'Terra Casino', url: 'https://terra.casino', description: 'Casino' },
      { name: 'TRITIUM', url: 'https://play.tritium.network', description: 'Game' }
    ]
  },
  {
    title: 'Blockchain information',
    count: 7,
    description: 'News and information sources about Terra Classic',
    links: [
      { name: 'Common.xyz', url: 'https://common.xyz', description: 'Official forum' },
      { name: 'CertiK Audit', url: 'https://www.certik.com/projects/terra', description: 'Security Audits' },
      { name: 'LuncDaily', url: 'https://luncdaily.com', description: 'News website' },
      { name: 'LUNC Burner', url: 'https://luncburner.io', description: 'News website' },
      { name: 'LuncToken.org', url: 'https://lunctoken.org', description: 'News website' },
      { name: 'Terraclassic.network', url: 'https://terraclassic.network', description: 'News website' },
      { name: 'Unofficialterraclassic.tech', url: 'https://unofficialterraclassic.tech', description: 'News website' }
    ]
  },
  {
    title: 'Wallets',
    count: 7,
    description: 'Secure wallets for storing and managing your Terra Classic assets',
    links: [
      { name: 'Galaxy Station', url: 'https://station.galaxy.eco', description: 'Web Wallet' },
      { name: 'Keplr', url: 'https://www.keplr.app', description: 'Extension Wallet' },
      { name: 'LUNCdash', url: 'https://luncdash.com', description: 'Web Wallet' },
      { name: 'Ping.pub', url: 'https://ping.pub/terra-luna-classic', description: 'Web Wallet' },
      { name: 'Terra Station', url: 'https://station.terra.money', description: 'Official Wallet' },
      { name: 'Trust Wallet', url: 'https://trustwallet.com', description: 'Mobile Wallet' },
      { name: 'Vultisig', url: 'https://vultisig.com', description: 'Multisig Wallet' }
    ]
  },
  {
    title: 'Markets - CEX',
    count: 15,
    description: 'Centralized exchanges where you can trade LUNC and USTC',
    links: [
      { name: 'Binance', url: 'https://www.binance.com/en/trade/LUNC_USDT', description: 'Exchange' },
      { name: 'BingX', url: 'https://bingx.com/en-us/spot/LUNCUSDT', description: 'Exchange' },
      { name: 'Bitget', url: 'https://www.bitget.com/spot/LUNCUSDT', description: 'Exchange' },
      { name: 'BitMart', url: 'https://www.bitmart.com/trade/en-US?symbol=LUNC_USDT', description: 'Exchange' },
      { name: 'Bybit', url: 'https://www.bybit.com/trade/spot/LUNC/USDT', description: 'Exchange' },
      { name: 'CoinSpot', url: 'https://www.coinspot.com.au/buy/lunc', description: 'Exchange' },
      { name: 'Crypto.com', url: 'https://crypto.com/exchange/trade/spot/LUNC_USDT', description: 'Exchange' },
      { name: 'Gate.io', url: 'https://www.gate.io/trade/LUNC_USDT', description: 'Exchange' },
      { name: 'HTX', url: 'https://www.htx.com/trade/lunc_usdt', description: 'Exchange' },
      { name: 'Kraken', url: 'https://trade.kraken.com/charts/KRAKEN:LUNC-USD', description: 'Exchange' },
      { name: 'KuCoin', url: 'https://www.kucoin.com/trade/LUNC-USDT', description: 'Exchange' },
      { name: 'LBank', url: 'https://www.lbank.info/exchange/lunc/usdt', description: 'Exchange' },
      { name: 'MEXC', url: 'https://www.mexc.com/exchange/LUNC_USDT', description: 'Exchange' },
      { name: 'OKX', url: 'https://www.okx.com/trade-spot/lunc-usdt', description: 'Exchange' },
      { name: 'WEEX', url: 'https://weex.com/trade/spot/LUNC_USDT', description: 'Exchange' }
    ]
  },
  {
    title: 'Markets - DEX',
    count: 10,
    description: 'Decentralized exchanges for trading Terra Classic assets',
    links: [
      { name: 'Garuda DeFi', url: 'https://garuda.fi', description: 'Decentralized Exchange' },
      { name: 'LUNCSwap.fun', url: 'https://luncswap.fun', description: 'Swap Platform' },
      { name: 'MDEX', url: 'https://mdex.co', description: 'Decentralized Exchange' },
      { name: 'Osmosis', url: 'https://app.osmosis.zone/?from=LUNC&to=OSMO', description: 'IBC DEX' },
      { name: 'PancakeSwap', url: 'https://pancakeswap.finance/swap?inputCurrency=0xC58C9a8f5855868DE09ce8F21430eE3c91a20fCE', description: 'BSC DEX' },
      { name: 'Raydium', url: 'https://raydium.io/swap', description: 'Solana DEX' },
      { name: 'Terraport', url: 'https://terraport.network/swap', description: 'Native DEX' },
      { name: 'Terraswap', url: 'https://app.terraswap.io', description: 'Native DEX' },
      { name: 'Uniswap', url: 'https://app.uniswap.org/#/swap?inputCurrency=0xd2877702675e6cEb975b4A1dFf9fb7BAF4C91ea9', description: 'Ethereum DEX' },
      { name: 'WESO DeFi', url: 'https://weso.finance', description: 'Decentralized Exchange' }
    ]
  },
  {
    title: 'Applications',
    count: 15,
    description: 'Applications and services built on Terra Classic',
    links: [
      { name: 'BigbangX', url: 'https://bigbangx.io', description: 'NFT marketplace' },
      { name: 'Coinhall', url: 'https://coinhall.org', description: 'Aggregator' },
      { name: 'Cookie.pay', url: 'https://cookie.pay', description: 'Payments' },
      { name: 'Garuda DeFi', url: 'https://garuda.fi', description: 'DEX' },
      { name: 'Juris Protocol', url: 'https://juris.network', description: 'Lending & borrowing' },
      { name: 'LbunProject', url: 'https://lbun.org', description: 'Orderbook' },
      { name: 'LuncPump.fun', url: 'https://luncpump.fun', description: 'Launchpad' },
      { name: 'Miata', url: 'https://miata.io', description: 'NFT Launchpad' },
      { name: 'Selenium', url: 'https://selenium.network', description: 'Synthetics platform' },
      { name: 'Sonic', url: 'https://sonic.network', description: 'Social / Messenger' },
      { name: 'Terraport', url: 'https://terraport.network', description: 'DEX' },
      { name: 'Terraport Token Factory', url: 'https://terraport.network/token-factory', description: 'Launchpad' },
      { name: 'TERRA.pump', url: 'https://terra.pump', description: 'Launchpad' },
      { name: 'Vyntrex', url: 'https://vyntrex.com', description: 'Aggregator' },
      { name: 'WESO DeFI', url: 'https://weso.finance', description: 'DEX' }
    ]
  }
];
