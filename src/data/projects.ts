export type ProjectIndicator = 'onchain' | 'hybrid' | 'support';

export interface ProjectLink {
  name: string;
  url: string;
  description?: string;
  indicator: ProjectIndicator;
  logo?: string;
}

export interface Category {
  title: string;
  description?: string;
  links: ProjectLink[];
}

export const categories: Category[] = [
  {
    title: 'For developers',
    description: 'Resources and tools for developers building on Terra Classic',
    links: [
      { name: 'Documentation', url: '/docs', description: 'Documentation for end-users and developers', indicator: 'support', logo: '/public/logos/for-developers/docs.png' },
      { name: 'Endpoints - LCD - BiNodes', url: 'https://api-lunc-lcd.binodes.com', description: 'LCD Endpoint', indicator: 'support' },
      { name: 'Endpoints - LCD - Hexxagon', url: 'https://lcd.terra-classic.hexxagon.io', description: 'LCD Endpoint', indicator: 'support', logo: '/public/logos/infrastructure/hexxagon.jpg' },
      { name: 'Endpoints - LCD - Public Node', url: 'https://terra-classic-lcd.publicnode.com', description: 'LCD Endpoint', indicator: 'support', logo: '/public/logos/infrastructure/publicnode.png' },
      { name: 'Endpoints - RPC - BiNodes', url: 'https://api-lunc-rpc.binodes.com', description: 'RPC Endpoint', indicator: 'support' },
      { name: 'Endpoints - RPC - Hexxagon', url: 'https://rpc.terra-classic.hexxagon.io', description: 'RPC Endpoint', indicator: 'support', logo: '/public/logos/infrastructure/hexxagon.jpg' },
      { name: 'Endpoints - RPC - Public Node', url: 'https://terra-classic-rpc.publicnode.com', description: 'RPC Endpoint', indicator: 'support', logo: '/public/logos/infrastructure/publicnode.png' },
      { name: 'Endpoints - FDC - Hexxagon', url: 'https://fcd.terra-classic.hexxagon.io', description: 'FCD Endpoint', indicator: 'support', logo: '/public/logos/infrastructure/hexxagon.jpg' },
      { name: 'Endpoints - FDC - Public Node', url: 'https://terra-classic-fcd.publicnode.com', description: 'FCD Endpoint', indicator: 'support', logo: '/public/logos/infrastructure/publicnode.png' },
      { name: 'Endpoints - GRPC - Hexxagon', url: 'https://grpc.terra-classic.hexxagon.io', description: 'GRPC Endpoint', indicator: 'support', logo: '/public/logos/infrastructure/hexxagon.jpg' },
      { name: 'Endpoints - HIVE - Hexxagon', url: 'https://hive.terra-classic.hexxagon.io', description: 'Hive Endpoint', indicator: 'support', logo: '/public/logos/infrastructure/hexxagon.jpg' },
      { name: 'Endpoints - API - Hexxagon', url: 'https://api.terra-classic.hexxagon.io', description: 'API Endpoint', indicator: 'support', logo: '/public/logos/infrastructure/hexxagon.jpg' },
      { name: 'GitHub', url: 'https://github.com/classic-terra/core', description: 'Code Repository', indicator: 'support', logo: '/public/logos/for-developers/github.png' },
      { name: 'Node snapshots', url: 'https://snapshots.hexxagon.io/cosmos/terra-classic/columbus-5/', description: 'Sync Tool', indicator: 'support', logo: '/public/logos/infrastructure/hexxagon.jpg' }
    ]
  },
  {
    title: 'Infrastructure & service providers',
    description: 'Critical infrastructure services for the Terra Classic network',
    links: [
      { name: 'Allnodes', url: 'https://www.allnodes.com/lunc/staking', description: 'Non-custodial node hosting', indicator: 'support', logo: '/public/logos/infrastructure/allnodes.png' },
      { name: 'Hexxagon', url: 'https://hexxagon.io', description: 'Validator hosting', indicator: 'support', logo: '/public/logos/infrastructure/hexxagon.jpg' },
      { name: 'Nownodes', url: 'https://nownodes.io', description: 'Blockchain RPC API', indicator: 'support', logo: '/public/logos/infrastructure/nownodes.jpg' },
      { name: 'Stakin.com', url: 'https://stakin.com', description: 'Dedicated nodes', indicator: 'support', logo: '/public/logos/infrastructure/stakin.png' }
    ]
  },
  {
    title: 'Blockchain tools',
    description: 'Tools for interacting with and analyzing the Terra Classic blockchain',
    links: [
      { name: 'ATOMScan', url: 'https://atomscan.com/terra', description: 'Analytics', indicator: 'support', logo: '/public/logos/tools/atomscan.png' },
      { name: 'DAO DAO', url: 'https://daodao.zone', description: 'DAO tooling', indicator: 'onchain', logo: '/public/logos/applications/daodao.jpg' },
      { name: 'Galaxy Finder', url: 'https://finder.terraclassic.community', description: 'Finder', indicator: 'support' },
      { name: 'LUNC Burner', url: 'https://lunc.tech', description: 'Analytics', indicator: 'support' },
      { name: 'LUNCdash', url: 'https://luncdash.com', description: 'Analytics', indicator: 'support', logo: '/public/logos/wallets/luncdash.jpeg' },
      { name: 'LUNCdash Finder', url: 'https://finder.luncdash.com', description: 'Finder', indicator: 'support', logo: '/public/logos/wallets/luncdash.jpeg' },
      { name: 'LUNC Metrics', url: 'https://luncmetrics.com', description: 'Analytics', indicator: 'support', logo: '/public/logos/tools/luncmetrics.png' },
      { name: 'LuncScan', url: 'https://luncscan.com', description: 'Analytics', indicator: 'support', logo: '/public/logos/tools/luncscan.webp' },
      { name: 'Lunc.Tools', url: 'https://lunc.tools', description: 'Analytics', indicator: 'support', logo: '/public/logos/tools/lunctools.jpg' },
      { name: 'MoonRunners', url: 'https://moon-runners.net', description: 'Analytics', indicator: 'support', logo: '/public/logos/tools/moonrunners.jpg' },
      { name: 'Ping.pub', url: 'https://ping.pub/terra-luna', description: 'Analytics', indicator: 'support' },
      { name: 'StakeBin', url: 'https://terraclassic.stakebin.io/', description: 'Analytics', indicator: 'support', logo: '/public/logos/tools/stakebin.png' },
      { name: 'Terraport Finder', url: 'https://finder.terraport.finance', description: 'Finder', indicator: 'onchain' },
      { name: 'TrackTerra', url: 'https://trackterra.org', description: 'Explorer', indicator: 'support', logo: '/public/logos/tools/trackterra.png' },
      { name: 'Validator.info', url: 'https://validator.info/terra-classic', description: 'Analytics', indicator: 'support', logo: '/public/logos/validators/validatorinfo.jpg' }
    ]
  },
  {
    title: 'Bridges',
    description: 'Cross-chain bridges connecting Terra Classic to other blockchains',
    links: [
      { name: 'skip:go', url: 'https://go.cosmos.network', description: 'IBC Bridge', indicator: 'hybrid', logo: '/public/logos/bridge/skipgo.jpg' },
      { name: 'Juris Bridge', url: 'https://dashboard.jurisprotocol.com/bridge', description: 'Cross-chain Bridge', indicator: 'support' },
      { name: 'Satellite', url: 'https://satellite.money/?destination_address=&asset_denom=uusdc&source=osmosis&destination=terra+classic', description: 'IBC Bridge', indicator: 'hybrid', logo: '/public/logos/bridge/satellite.jpg' },
      { name: 'Terraport Bridge', url: 'https://terraport.finance/bridge', description: 'Cross-chain Bridge', indicator: 'onchain' },
      { name: 'TFM', url: 'https://app.tfm.com/ibc', description: 'IBC Bridge', indicator: 'support', logo: '/public/logos/bridge/tfm.jpg' },
      { name: 'Tritium Bridge', url: 'https://bridge.terratritium.com', description: 'Cross-chain Bridge', indicator: 'support', logo: '/public/logos/bridge/tritium.jpg' }
    ]
  },
  {
    title: 'Validators',
    description: 'Validator communities and resources',
    links: [
      { name: 'Validator.Info', url: 'https://validator.info/terra-classic', description: 'Validator Info', indicator: 'support', logo: '/public/logos/validators/validatorinfo.jpg' },
      { name: 'Validators Discord group', url: 'https://discord.com/invite/ARW627EU4P', description: 'Community Chat', indicator: 'support', logo: '/public/logos/validators/discord.png' },
      { name: 'Validators Telegram group', url: 'https://t.me/transparentvalidatorchat', description: 'Community Chat', indicator: 'support', logo: '/public/logos/validators/telegram.png' }
    ]
  },
  {
    title: 'Entertainment',
    description: 'Games and entertainment platforms built on Terra Classic',
    links: [
      { name: 'Air Force Lunc', url: 'https://www.bigbangx.io/air-force-lunc', description: 'Game', indicator: 'onchain', logo: '/public/logos/entertainment/airforcelunc.png' },
      { name: 'Galactic Shift', url: 'https://galacticshift.io', description: 'Game WIP', indicator: 'onchain', logo: '/public/logos/entertainment/galacticshift.jpg' },
      { name: 'Garuda The Protector', url: 'https://play.google.com/store/apps/details?id=com.GarudaNodes.GarudaTheProtector3&pcampaignid=web_share', description: 'Game', indicator: 'onchain' },
      { name: 'Legends of Terratria', url: 'https://aetherverge.io/games/lot', description: 'Game WIP', indicator: 'onchain', logo: '/public/logos/entertainment/terratria.png' },
      { name: 'Lunc Zombie', url: 'https://play.google.com/store/apps/details?id=com.Unimasoft.Commando&pcampaignid=web_share', description: 'Game', indicator: 'onchain', logo: '/public/logos/entertainment/lunczombie.png' },
      { name: 'Luncvers3', url: 'https://luncverse.io', description: 'Metaverse', indicator: 'onchain', logo: '/public/logos/entertainment/luncverse.jpg' },
      { name: 'MIOFF', url: 'https://mioff-token.com', description: 'Festival', indicator: 'support', logo: '/public/logos/entertainment/mioff.jpg' },
      { name: 'PENGS', url: 'https://x.com/pixel_pengs', description: 'Game WIP', indicator: 'onchain', logo: '/public/logos/entertainment/pengs.jpg' },
      { name: 'Terra Casino', url: 'https://terracasino.io', description: 'Casino', indicator: 'support', logo: '/public/logos/entertainment/terracasino.png' },
      { name: 'TRITIUM', url: 'https://play.terratritium.com', description: 'Game', indicator: 'onchain', logo: '/public/logos/bridge/tritium.jpg' }
    ]
  },
  {
    title: 'Blockchain information',
    description: 'News and information sources about Terra Classic',
    links: [
      { name: 'Discourse', url: 'https://discourse.luncgoblins.com', description: 'Community forum', indicator: 'support', logo: '/public/logos/media/discourse.png' },
      { name: 'Common.xyz', url: 'https://common.xyz/terra-luna-classic-lunc/discussions', description: 'Official forum', indicator: 'support', logo: '/public/logos/media/common.png' },
      { name: 'CertiK Audit', url: 'https://skynet.certik.com/projects/terra', description: 'Security Audits', indicator: 'support', logo: '/public/logos/media/certik.png' },
      { name: 'LuncDaily', url: 'https://luncdaily.com', description: 'News website', indicator: 'support', logo: '/public/logos/media/luncdaily.jpg' },
      { name: 'LUNC Burner', url: 'https://lunc.tech', description: 'News website', indicator: 'support' },
      { name: 'LuncToken.org', url: 'https://lunctoken.org', description: 'News website', indicator: 'support', logo: '/public/logos/media/lunctoken.webp'},
      { name: 'Terraclassic.network', url: 'https://terraclassic.network', description: 'News website', indicator: 'support' },
      { name: 'Unofficialterraclassic.tech', url: 'https://unofficialterraclassic.tech', description: 'News website', indicator: 'support', logo: '/public/logos/media/unofficial.png' }
    ]
  },
  {
    title: 'Wallets',
    description: 'Secure wallets for storing and managing your Terra Classic assets',
    links: [
      { name: 'Cosmostation', url: 'https://www.cosmostation.io', description: 'Extension Wallet', indicator: 'support', logo: '/public/logos/wallets/cosmostation.png' },
      { name: 'Galaxy Station', url: 'https://station.hexxagon.io', description: 'Web Wallet', indicator: 'onchain', logo: '/public/logos/wallets/galaxystation.webp' },
      { name: 'Keplr', url: 'https://www.keplr.app', description: 'Extension Wallet', indicator: 'hybrid', logo: '/public/logos/wallets/keplr.png' },
      { name: 'LUNCdash', url: 'https://luncdash.com', description: 'Web Wallet', indicator: 'onchain', logo: '/public/logos/wallets/luncdash.jpeg' },
      { name: 'Orbitar', url: 'https://orbitar.app', description: 'Mobile wallet', indicator: 'support' },
      { name: 'Ping.pub', url: 'https://ping.pub/terra-luna', description: 'Web Wallet', indicator: 'support', logo: '/public/logos/wallets/pingpub.jpg' },
      { name: 'Terra Station', url: 'https://station.terra.money', description: 'Official Wallet', indicator: 'onchain', logo: '/public/logos/wallets/station.png' },
      { name: 'Trust Wallet', url: 'https://trustwallet.com', description: 'Mobile Wallet', indicator: 'support', logo: '/public/logos/wallets/trustwallet.webp' },
      { name: 'Vultisig', url: 'https://vultisig.com', description: 'Multisig Wallet', indicator: 'hybrid', logo: '/public/logos/wallets/vultisig.jpeg' }
    ]
  },
  {
    title: 'Markets - CEX',
    description: 'Centralized exchanges where you can trade LUNC and USTC',
    links: [
      { name: 'Binance', url: 'https://www.binance.com/en/trade/LUNC_TRY', description: 'Exchange', indicator: 'support', logo: '/public/logos/cex/binance.png' },
      { name: 'BingX', url: 'https://bingx.com/en-us/spot/LUNCUSDT', description: 'Exchange', indicator: 'support' },
      { name: 'Bitget', url: 'https://www.bitget.com/spot/LUNCUSDT', description: 'Exchange', indicator: 'support', logo: '/public/logos/cex/bitget.png' },
      { name: 'BitMart', url: 'https://www.bitmart.com/trade/en-US?symbol=LUNC_USDT', description: 'Exchange', indicator: 'support', logo: '/public/logos/cex/bitmart.png' },
      { name: 'Bybit', url: 'https://www.bybit.com/trade/spot/LUNC/USDT', description: 'Exchange', indicator: 'support', logo: '/public/logos/cex/bybit.png' },
      { name: 'ChangeNOW', url: 'https://changenow.io/currencies/terra-classic?from=lunc&to=eth', description: 'Instant swap exchange', indicator: 'support', logo: '/public/logos/cex/changenow.png' },
      { name: 'CoinSpot', url: 'https://www.coinspot.com.au/buy/luna', description: 'Exchange', indicator: 'support', logo: '/public/logos/cex/coinspot.png' },
      { name: 'Crypto.com', url: 'https://crypto.com/exchange/trade/LUNC_USD', description: 'Exchange', indicator: 'support', logo: '/public/logos/cex/cryptocom.png' },
      { name: 'Gate.io', url: 'https://www.gate.io/trade/LUNC_USDT', description: 'Exchange', indicator: 'support' },
      { name: 'HTX', url: 'https://www.htx.com/trade/lunc_usdt', description: 'Exchange', indicator: 'support' },
      { name: 'Kraken', url: 'https://pro.kraken.com/app/trade/luna-usd', description: 'Exchange', indicator: 'support', logo: '/public/logos/cex/kraken.png' },
      { name: 'KuCoin', url: 'https://www.kucoin.com/trade/LUNC-USDT', description: 'Exchange', indicator: 'support' },
      { name: 'LBank', url: 'https://www.lbank.com/trade/lunc_usdt', description: 'Exchange', indicator: 'support' },
      { name: 'MEXC', url: 'https://www.mexc.com/exchange/LUNC_USDT', description: 'Exchange', indicator: 'support', logo: '/public/logos/cex/mexc.png' },
      { name: 'Phemex', url: 'https://phemex.com/trade/LUNC-USDT', description: 'Exchange', indicator: 'support', logo: '/public/logos/cex/phemex.png' },
      { name: 'OKX', url: 'https://www.okx.com/trade-spot/lunc-usdt', description: 'Exchange', indicator: 'support' },
      { name: 'SimpleSwap', url: 'https://simpleswap.io/coins/lunc', description: 'Instant swap exchange', indicator: 'support', logo: '/public/logos/cex/simpleswap.png' },
      { name: 'WEEX', url: 'https://weex.com/trade/LUNC-USDT', description: 'Exchange', indicator: 'support', logo: '/public/logos/cex/weex.png' }
    ]
  },
  {
    title: 'Markets - DEX',
    description: 'Decentralized exchanges for trading Terra Classic assets',
    links: [
      { name: 'Garuda DeFi', url: 'https://garuda-defi.org', description: 'Decentralized Exchange', indicator: 'onchain', logo: '/public/logos/dex/garuda.jpg' },
      { name: 'MDEX', url: 'https://bsc.mdex.com/#/swap?outputCurrency=0x156ab3346823b651294766e23e6cf87254d68962', description: 'Decentralized Exchange', indicator: 'support' },
      { name: 'Osmosis', url: 'https://app.osmosis.zone/?from=LUNC&to=OSMO', description: 'IBC DEX', indicator: 'hybrid', logo: '/public/logos/dex/osmosis.png' },
      { name: 'PancakeSwap', url: 'https://pancakeswap.finance/swap?outputCurrency=0x156ab3346823b651294766e23e6cf87254d68962', description: 'BSC DEX', indicator: 'support' },
      { name: 'Raydium', url: 'https://raydium.io/swap/?inputMint=F6v4wfAdJB8D8p77bMXZgYt8TDKsYxLYxH5AFhUkYx9W&outputMint=sol', description: 'Solana DEX', indicator: 'support', logo: '/public/logos/dex/raydium.png' },
      { name: 'Terraport', url: 'https://terraport.finance', description: 'Native DEX', indicator: 'onchain', logo: '/public/logos/dex/terraport.png' },
      { name: 'Terraswap', url: 'https://app-classic.terraswap.io', description: 'Native DEX', indicator: 'onchain', logo: '/public/logos/dex/terraswap.png' },
      { name: 'Uniswap', url: 'https://app.uniswap.org/swap?outputCurrency=0xbd31ea8212119f94a611fa969881cba3ea06fa3d', description: 'Ethereum DEX', indicator: 'support' },
      { name: 'WESO DeFi', url: 'https://wesoworld.io', description: 'Decentralized Exchange', indicator: 'onchain', logo: '/public/logos/dex/weso.jpg' }
    ]
  },
  {
    title: 'Applications',
    description: 'Applications and services built on Terra Classic',
    links: [
      { name: 'BigbangX', url: 'https://bigbangx.io', description: 'NFT marketplace', indicator: 'onchain', logo: '/public/logos/applications/bigbang.png' },
      { name: 'Coinhall', url: 'https://coinhall.org/terraclassic', description: 'Aggregator', indicator: 'onchain', logo: '/public/logos/applications/coinhall.png' },
      { name: 'Cookie.pay', url: 'https://lunc.tools/cookie-pay', description: 'Payments', indicator: 'onchain', logo: '/public/logos/applications/cookiepay.png' },
      { name: 'Garuda DeFi', url: 'https://garuda-defi.org', description: 'DEX', indicator: 'onchain' },
      { name: 'Juris Protocol', url: 'https://jurisprotocol.com', description: 'Lending & borrowing', indicator: 'onchain' },
      { name: 'LbunProject', url: 'https://orderbook.lbunproject.tech', description: 'Orderbook', indicator: 'onchain', logo: '/public/logos/applications/lbun.png' },
      { name: 'Miata', url: 'https://miata.io', description: 'NFT Launchpad', indicator: 'onchain', logo: '/public/logos/applications/miata.png' },
      { name: 'Selenium', url: 'https://selenium.finance', description: 'Synthetics platform', indicator: 'onchain', logo: '/public/logos/applications/selenium.png' },
      { name: 'Sonic', url: 'https://sonikchain.com', description: 'Social / Messenger', indicator: 'onchain', logo: '/public/logos/applications/son.png' },
      { name: 'Terraport', url: 'https://terraport.finance', description: 'DEX', indicator: 'onchain' },
      { name: 'TERRA.pump', url: 'https://terrapump.fun', description: 'Launchpad', indicator: 'onchain', logo: '/public/logos/applications/terrapump.png' },
      { name: 'Vyntrex', url: 'https://vyntrex.io', description: 'Aggregator', indicator: 'support', logo: '/public/logos/applications/vyntrex.png' },
      { name: 'WESO DeFI', url: 'https://wesoworld.io', description: 'DEX', indicator: 'onchain', logo: '/public/logos/dex/weso.jpg' }
    ]
  }
];
