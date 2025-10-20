import { categories } from "./categories";

export type ProjectIndicator = 'onchain' | 'hybrid' | 'support';

export interface ProjectLink {
  name: string;
  url: string;
  description?: string;
  indicator: ProjectIndicator;
  logo?: string;
  /**
   * The logo to be used when the website is visited in dark mode. If not specified, the light logo will be used.
   */
  darkLogo?: string;
  /**
   * Marks the project as Work-In-Progress. When true, a small "WIP" pill will be shown next to the description.
   */
  wip?: boolean;
  categories?: (keyof typeof categories)[];
}

export const projects: ProjectLink[] = [
  {
    name: 'Air Force Lunc',
    url: 'https://www.bigbangx.io/air-force-lunc',
    description: 'Game',
    indicator: 'onchain',
    categories: ['entertainment']
  },
  { 
    name: 'Allnodes',
    url: 'https://www.allnodes.com/lunc/staking',
    description: 'Non-custodial node hosting',
    indicator: 'support',
    logo: '/public/logos/infrastructure/allnodes.png',
    categories: ['infrastructure', 'validators']
  },
  { 
    name: 'ATOMScan',
    url: 'https://atomscan.com/terra',
    description: 'Analytics',
    indicator: 'support',
    logo: '/public/logos/tools/atomscan.png',
    categories: ['tools']
  },
  { 
    name: 'BigbangX',
    url: 'https://bigbangx.io',
    description: 'NFT marketplace',
    indicator: 'onchain',
    logo: '/public/logos/applications/bigbangx.png',
    darkLogo: '/public/logos/applications/bigbangx-dark.png',
    categories: ['applications']
  },
  { 
    name: 'Binance',
    url: 'https://www.binance.com/en/trade/LUNC_TRY',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/binance.svg',
    categories: ['cex']
  },
  { 
    name: 'BingX',
    url: 'https://bingx.com/en-us/spot/LUNCUSDT',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/bingx.png',
    categories: ['cex']
  },
  { 
    name: 'Bitget',
    url: 'https://www.bitget.com/spot/LUNCUSDT',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/bitget.png',
    categories: ['cex']
  },
  { 
    name: 'BitMart',
    url: 'https://www.bitmart.com/trade/en-US?symbol=LUNC_USDT',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/bitmart.png',
    categories: ['cex']
  },
  { 
    name: 'Bybit',
    url: 'https://www.bybit.com/trade/spot/LUNC/USDT',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/bybit.svg',
    darkLogo: '/public/logos/cex/bybit-dark.svg',
    categories: ['cex']
  },
  { 
    name: 'CertiK',
    url: 'https://skynet.certik.com/projects/terra',
    description: 'Security Audits',
    indicator: 'support',
    logo: '/public/logos/media/certik.svg',
    darkLogo: '/public/logos/media/certik-dark.svg',
    categories: ['information']
  },
  { 
    name: 'ChangeNOW',
    url: 'https://changenow.io/currencies/terra-classic?from=lunc&to=eth',
    description: 'Instant swap exchange',
    indicator: 'support',
    logo: '/public/logos/cex/changenow.svg',
    darkLogo: '/public/logos/cex/changenow-dark.svg',
    categories: ['cex']
  },
  { 
    name: 'Coinhall',
    url: 'https://coinhall.org/terraclassic',
    description: 'Aggregator',
    indicator: 'support',
    logo: '/public/logos/applications/coinhall.svg',
    categories: ['applications']
  },
  { 
    name: 'CoinSpot',
    url: 'https://www.coinspot.com.au/buy/luna',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/coinspot.svg',
    categories: ['cex']
  },
  { 
    name: 'Common.xyz',
    url: 'https://common.xyz/terra-luna-classic-lunc/discussions',
    description: 'Official forum',
    indicator: 'support',
    logo: '/public/logos/validators/common.svg',
    categories: ['information', 'validator']
  },
  { 
    name: 'Cookie.pay',
    url: 'https://lunc.tools/cookie-pay',
    description: 'Payments',
    indicator: 'onchain',
    logo: '/public/logos/tools/lunctools.png',
    categories: ['applications']
  },
  { 
    name: 'Cosmostation',
    url: 'https://www.cosmostation.io',
    description: 'Extension Wallet',
    indicator: 'support',
    logo: '/public/logos/wallets/cosmostation.svg',
    categories: ['wallets']
  },
  { 
    name: 'Crypto.com',
    url: 'https://crypto.com/exchange/trade/LUNC_USD',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/cryptocom.svg',
    darkLogo: '/public/logos/cex/cryptocom-dark.svg',
    categories: ['cex']
  },
  { 
    name: 'DAO DAO',
    url: 'https://daodao.zone',
    description: 'DAO tooling',
    indicator: 'hybrid',
    logo: '/public/logos/applications/daodao.svg',
    darkLogo: '/public/logos/applications/daodao-dark.svg',
    categories: ['applications', 'tools']
  },
  { 
    name: 'Discourse',
    url: 'https://discourse.luncgoblins.com',
    description: 'Community forum',
    indicator: 'support',
    logo: '/public/logos/validators/discourse.svg',
    categories: ['information', 'validator']
  },
  { 
    name: 'Documentation',
    url: '/docs',
    description: 'Documentation for end-users and developers',
    indicator: 'onchain',
    categories: ['for-developers', 'validators', 'information']
  },
  { 
    name: 'Endpoint (LCD) - BiNodes',
    url: 'https://api-lunc-lcd.binodes.com',
    description: 'LCD Endpoint',
    indicator: 'support',
    logo: '/public/logos/infrastructure/binodes.png',
    categories: ['for-developers', 'infrastructure']
  },
  { 
    name: 'Endpoint (LCD) - Hexxagon',
    url: 'https://lcd.terra-classic.hexxagon.io',
    description: 'LCD Endpoint',
    indicator: 'support',
    logo: '/public/logos/infrastructure/hexxagon.png',
    categories: ['for-developers', 'infrastructure']
  },
  { 
    name: 'Endpoint (LCD) - Public Node',
    url: 'https://terra-classic-lcd.publicnode.com',
    description: 'LCD Endpoint',
    indicator: 'support',
    logo: '/public/logos/infrastructure/publicnode.png',
    categories: ['for-developers', 'infrastructure']
  },
  { 
    name: 'Endpoint (RPC) - BiNodes',
    url: 'https://api-lunc-rpc.binodes.com',
    description: 'RPC Endpoint',
    indicator: 'support',
    logo: '/public/logos/infrastructure/binodes.png',
    categories: ['for-developers', 'infrastructure']
  },
  { 
    name: 'Endpoint (RPC) - Hexxagon',
    url: 'https://rpc.terra-classic.hexxagon.io',
    description: 'RPC Endpoint',
    indicator: 'support',
    logo: '/public/logos/infrastructure/hexxagon.png',
    categories: ['for-developers', 'infrastructure']
  },
  { 
    name: 'Endpoint (RPC) - Public Node',
    url: 'https://terra-classic-rpc.publicnode.com',
    description: 'RPC Endpoint',
    indicator: 'support',
    logo: '/public/logos/infrastructure/publicnode.png',
    categories: ['for-developers', 'infrastructure']
  },
  { 
    name: 'Endpoint (FCD) - Hexxagon',
    url: 'https://fcd.terra-classic.hexxagon.io',
    description: 'FCD Endpoint',
    indicator: 'support',
    logo: '/public/logos/infrastructure/hexxagon.png',
    categories: ['for-developers', 'infrastructure']
  },
  { 
    name: 'Endpoint (FCD) - Public Node',
    url: 'https://terra-classic-fcd.publicnode.com',
    description: 'FCD Endpoint',
    indicator: 'support',
    logo: '/public/logos/infrastructure/publicnode.png',
    categories: ['for-developers', 'infrastructure']
  },
  { 
    name: 'Endpoint (GRPC) - Hexxagon',
    url: 'https://grpc.terra-classic.hexxagon.io',
    description: 'GRPC Endpoint',
    indicator: 'support',
    logo: '/public/logos/infrastructure/hexxagon.png',
    categories: ['for-developers', 'infrastructure']
  },
  { 
    name: 'Endpoint (HIVE) - Hexxagon',
    url: 'https://hive.terra-classic.hexxagon.io',
    description: 'Hive Endpoint',
    indicator: 'support',
    logo: '/public/logos/infrastructure/hexxagon.png',
    categories: ['for-developers', 'infrastructure']
  },
  { 
    name: 'Endpoint (API) - Hexxagon',
    url: 'https://api.terra-classic.hexxagon.io',
    description: 'API Endpoint',
    indicator: 'support',
    logo: '/public/logos/infrastructure/hexxagon.png',
    categories: ['for-developers', 'infrastructure']
  },
  { 
    name: 'Galactic Shift',
    url: 'https://galacticshift.io',
    description: 'Game',
    indicator: 'onchain',
    logo: '/public/logos/entertainment/galacticshift.png',
    darkLogo: '/public/logos/entertainment/galacticshift-dark.png',
    wip: true,
    categories: ['entertainment']
  },
  { 
    name: 'Galaxy Finder',
    url: 'https://finder.terraclassic.community',
    description: 'Finder',
    indicator: 'onchain',
    logo: '/public/logos/wallets/galaxystation.svg',
    categories: ['tools']
  },
  { 
    name: 'Galaxy Station',
    url: 'https://station.hexxagon.io',
    description: 'Web Wallet',
    indicator: 'support',
    logo: '/public/logos/wallets/galaxystation.svg',
    categories: ['wallets', 'validator', 'tools']
  },
  { 
    name: 'Garuda DeFi',
    url: 'https://garuda-defi.org',
    description: 'Decentralized Exchange',
    indicator: 'onchain',
    logo: '/public/logos/dex/garuda.png',
    categories: ['dex', 'applications', 'tools']
  },
  { 
    name: 'Garuda The Protector',
    url: 'https://play.google.com/store/apps/details?id=com.GarudaNodes.GarudaTheProtector3&pcampaignid=web_share',
    description: 'Game',
    indicator: 'onchain',
    categories: ['entertainment']
  },
  { 
    name: 'Gate.io',
    url: 'https://www.gate.io/trade/LUNC_USDT',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/gateio.png',
    categories: ['cex']
  },
  { 
    name: 'GitHub',
    url: 'https://github.com/classic-terra/core',
    description: 'Code Repository',
    indicator: 'support',
    logo: '/public/logos/for-developers/github.svg',
    darkLogo: '/public/logos/for-developers/github-dark.svg',
    categories: ['for-developers']
  },
  { 
    name: 'Hexxagon',
    url: 'https://hexxagon.io',
    description: 'Validator hosting',
    indicator: 'support',
    logo: '/public/logos/infrastructure/hexxagon.png',
    categories: ['infrastructure', 'validators']
  },
  { 
    name: 'HTX',
    url: 'https://www.htx.com/trade/lunc_usdt',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/htx.svg',
    darkLogo: '/public/logos/cex/htx-dark.svg',
    categories: ['cex']
  },
  { 
    name: 'Juris Bridge',
    url: 'https://dashboard.jurisprotocol.com/bridge',
    description: 'Cross-chain Bridge',
    indicator: 'hybrid',
    logo: '/public/logos/applications/jurisprotocol.svg',
    categories: ['bridges']
  },
  { 
    name: 'Juris Protocol',
    url: 'https://jurisprotocol.com',
    description: 'Lending & borrowing',
    indicator: 'onchain',
    logo: '/public/logos/applications/jurisprotocol.svg',
    darkLogo: '/public/logos/applications/jurisprotocol-dark.svg',
    categories: ['applications']
  },
  { 
    name: 'Keplr',
    url: 'https://www.keplr.app',
    description: 'Extension Wallet',
    indicator: 'support',
    logo: '/public/logos/wallets/keplr.svg',
    categories: ['wallets']
  },
  { 
    name: 'Kraken',
    url: 'https://pro.kraken.com/app/trade/luna-usd',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/kraken.svg',
    darkLogo: '/public/logos/cex/kraken-dark.svg',
    categories: ['cex']
  },
  { 
    name: 'KuCoin',
    url: 'https://www.kucoin.com/trade/LUNC-USDT',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/kucoin.svg',
    categories: ['cex']
  },
  { 
    name: 'LBank',
    url: 'https://www.lbank.com/trade/lunc_usdt',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/lbank.svg',
    darkLogo: '/public/logos/cex/lbank-dark.svg',
    categories: ['cex']
  },
  { 
    name: 'LbunProject',
    url: 'https://orderbook.lbunproject.tech',
    description: 'Orderbook',
    indicator: 'onchain',
    logo: '/public/logos/applications/base.png',
    categories: ['applications']
  },
  { 
    name: 'Legends of Terratria',
    url: 'https://aetherverge.io/games/lot',
    description: 'Game',
    indicator: 'onchain',
    logo: '/public/logos/entertainment/aetherverge.svg',
    wip: true,
    categories: ['entertainment']
  },
  { 
    name: 'LUNC Burner',
    url: 'https://lunc.tech',
    description: 'Analytics',
    indicator: 'onchain',
    logo: '/public/logos/tools/lunctech.png',
    categories: ['tools', 'information']
  },
  { 
    name: 'LuncDaily',
    url: 'https://luncdaily.com',
    description: 'News website',
    indicator: 'onchain',
    logo: '/public/logos/media/luncdaily.png',
    categories: ['information']
  },
  { 
    name: 'LUNCdash',
    url: 'https://luncdash.com',
    description: 'Web Wallet',
    indicator: 'onchain',
    logo: '/public/logos/tools/luncdash.png',
    categories: ['wallets', 'tools']
  },
  { 
    name: 'LUNCdash Finder',
    url: 'https://finder.luncdash.com',
    description: 'Finder',
    indicator: 'onchain',
    logo: '/public/logos/tools/luncdash.png',
    categories: ['tools']
  },
  { 
    name: 'LUNC Metrics',
    url: 'https://luncmetrics.com',
    description: 'Analytics',
    indicator: 'onchain',
    logo: '/public/logos/tools/luncmetrics.png',
    categories: ['tools']
  },
  { 
    name: 'LuncScan',
    url: 'https://luncscan.com',
    description: 'Analytics',
    indicator: 'onchain',
    logo: '/public/logos/tools/luncscan.png',
    categories: ['tools']
  },
  { 
    name: 'LuncToken.org',
    url: 'https://lunctoken.org',
    description: 'News website',
    indicator: 'onchain',
    logo: '/public/logos/media/lunctoken.webp',
    categories: ['information']
  },
  { 
    name: 'Lunc.Tools',
    url: 'https://lunc.tools',
    description: 'Analytics',
    indicator: 'onchain',
    logo: '/public/logos/tools/lunctools.png',
    categories: ['tools']
  },
  { 
    name: 'Luncvers3',
    url: 'https://luncverse.io',
    description: 'Metaverse',
    indicator: 'onchain',
    logo: '/public/logos/entertainment/luncverse.png',
    categories: ['entertainment']
  },
  { 
    name: 'Lunc Zombie',
    url: 'https://play.google.com/store/apps/details?id=com.Unimasoft.Commando&pcampaignid=web_share',
    description: 'Game',
    indicator: 'onchain',
    categories: ['entertainment']
  },
  { 
    name: 'MDEX',
    url: 'https://bsc.mdex.com/#/swap?outputCurrency=0x156ab3346823b651294766e23e6cf87254d68962',
    description: 'Decentralized Exchange',
    indicator: 'support',
    logo: '/public/logos/dex/mdex.svg',
    categories: ['dex']
  },
  { 
    name: 'MEXC',
    url: 'https://www.mexc.com/exchange/LUNC_USDT',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/mexc.svg',
    categories: ['cex']
  },
  { 
    name: 'Miata',
    url: 'https://miata.io',
    description: 'NFT Launchpad',
    indicator: 'onchain',
    logo: '/public/logos/applications/miata.png',
    categories: ['applications', 'entertainment']
  },
  { 
    name: 'MIOFF',
    url: 'https://mioff-token.com',
    description: 'Festival',
    indicator: 'onchain',
    logo: '/public/logos/entertainment/mioff.png',
    categories: ['entertainment']
  },
  { 
    name: 'Node snapshots',
    url: 'https://snapshots.hexxagon.io/cosmos/terra-classic/columbus-5/',
    description: 'Sync Tool',
    indicator: 'support',
    logo: '/public/logos/infrastructure/hexxagon.png',
    categories: ['infrastructure', 'validators']
  },
  { 
    name: 'Nownodes',
    url: 'https://nownodes.io',
    description: 'Blockchain RPC API',
    indicator: 'support',
    logo: '/public/logos/infrastructure/nownodes.svg',
    darkLogo: '/public/logos/infrastructure/nownodes-dark.svg',
    categories: ['infrastructure', 'validators']
  },
  { 
    name: 'Orbitar',
    url: 'https://orbitar.app',
    description: 'Mobile wallet',
    indicator: 'onchain',
    logo: '/public/logos/wallets/orbitar.png',
    categories: ['wallets']
  },
  { 
    name: 'Osmosis',
    url: 'https://app.osmosis.zone/?from=LUNC&to=OSMO',
    description: 'IBC DEX',
    indicator: 'hybrid',
    logo: '/public/logos/dex/osmosis.svg',
    categories: ['dex']
  },
  { 
    name: 'PancakeSwap',
    url: 'https://pancakeswap.finance/swap?outputCurrency=0x156ab3346823b651294766e23e6cf87254d68962',
    description: 'BSC DEX',
    indicator: 'support',
    logo: '/public/logos/dex/pancakeswap.svg',
    categories: ['dex']
  },
  { 
    name: 'PENGS',
    url: 'https://x.com/pixel_pengs',
    description: 'Game',
    indicator: 'onchain',
    logo: '/public/logos/entertainment/pengs.jpg',
    wip: true,
    categories: ['entertainment']
  },
  { 
    name: 'Phemex',
    url: 'https://phemex.com/trade/LUNC-USDT',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/phemex.svg',
    darkLogo: '/public/logos/cex/phemex-dark.svg',
    categories: ['cex']
  },
  { 
    name: 'Ping.pub',
    url: 'https://ping.pub/terra-luna',
    description: 'Analytics',
    indicator: 'support',
    logo: '/public/logos/tools/ping.svg',
    categories: ['tools']
  },
  { 
    name: 'Raydium',
    url: 'https://raydium.io/swap/?inputMint=F6v4wfAdJB8D8p77bMXZgYt8TDKsYxLYxH5AFhUkYx9W&outputMint=sol',
    description: 'Solana DEX',
    indicator: 'support',
    logo: '/public/logos/dex/raydium.svg',
    categories: ['dex']
  },
  { 
    name: 'Satellite',
    url: 'https://satellite.money/?destination_address=&asset_denom=uusdc&source=osmosis&destination=terra+classic',
    description: 'IBC Bridge',
    indicator: 'hybrid',
    logo: '/public/logos/bridge/axelar.jpg',
    categories: ['bridges']
  },
  { 
    name: 'Selenium',
    url: 'https://selenium.finance',
    description: 'Synthetics platform',
    indicator: 'onchain',
    logo: '/public/logos/applications/selenium.png',
    categories: ['applications']
  },
  { 
    name: 'SimpleSwap',
    url: 'https://simpleswap.io/coins/lunc',
    description: 'Instant swap exchange',
    indicator: 'support',
    logo: '/public/logos/cex/simpleswap.svg',
    categories: ['cex']
  },
  { 
    name: 'skip:go',
    url: 'https://go.cosmos.network',
    description: 'IBC Bridge',
    indicator: 'hybrid',
    logo: '/public/logos/bridge/skipgo.svg',
    categories: ['bridges']
  },
  { 
    name: 'Sonic',
    url: 'https://sonikchain.com',
    description: 'Social / Messenger',
    indicator: 'hybrid',
    logo: '/public/logos/applications/son.png',
    categories: ['applications']
  },
  { 
    name: 'StakeBin',
    url: 'https://terraclassic.stakebin.io/',
    description: 'Analytics',
    indicator: 'support',
    logo: '/public/logos/tools/stakebin.png',
    categories: ['tools']
  },
  { 
    name: 'Stakin.com',
    url: 'https://stakin.com',
    description: 'Dedicated nodes',
    indicator: 'support',
    logo: '/public/logos/infrastructure/stakin.svg',
    categories: ['infrastructure', 'validators']
  },
  { 
    name: 'Terra Casino',
    url: 'https://terracasino.io',
    description: 'Casino',
    indicator: 'hybrid',
    logo: '/public/logos/entertainment/terracasino.png',
    categories: ['entertainment']
  },
  { 
    name: 'Terraclassic.network',
    url: 'https://terraclassic.network',
    description: 'News website',
    indicator: 'onchain',
    logo: '/public/logos/media/classicnetwork.png',
    categories: ['information']
  },
  { 
    name: 'Terraport',
    url: 'https://terraport.finance',
    description: 'Native DEX',
    indicator: 'onchain',
    logo: '/public/logos/dex/terraport.svg',
    categories: ['dex', 'applications']
  },
  { 
    name: 'Terraport Bridge',
    url: 'https://terraport.finance/bridge',
    description: 'Cross-chain Bridge',
    indicator: 'hybrid',
    logo: '/public/logos/dex/terraport.svg',
    categories: ['bridges']
  },
  { 
    name: 'Terraport Finder',
    url: 'https://finder.terraport.finance',
    description: 'Finder',
    indicator: 'onchain',
    logo: '/public/logos/dex/terraport.svg',
    categories: ['tools']
  },
  { 
    name: 'Terra Station',
    url: 'https://station.terra.money',
    description: 'Official Wallet',
    indicator: 'onchain',
    logo: '/public/logos/wallets/terra.svg',
    categories: ['wallets']
  },
  { 
    name: 'TERRA.pump',
    url: 'https://terrapump.fun',
    description: 'Launchpad',
    indicator: 'onchain',
    logo: '/public/logos/applications/terrapump.png',
    categories: ['applications', 'tools']
  },
  { 
    name: 'Terraswap',
    url: 'https://app-classic.terraswap.io',
    description: 'Native DEX',
    indicator: 'onchain',
    logo: '/public/logos/dex/terraswap.svg',
    categories: ['dex']
  },
  { 
    name: 'TFM',
    url: 'https://app.tfm.com/ibc',
    description: 'IBC Bridge',
    indicator: 'support',
    categories: ['bridges']
  },
  { 
    name: 'TrackTerra',
    url: 'https://trackterra.org',
    description: 'Explorer',
    indicator: 'onchain',
    logo: '/public/logos/tools/trackterra.png',
    categories: ['tools']
  },
  { 
    name: 'TRITIUM',
    url: 'https://play.terratritium.com',
    description: 'Game',
    indicator: 'onchain',
    logo: '/public/logos/entertainment/terratritium.svg',
    darkLogo: '/public/logos/entertainment/terratritium-dark.svg',
    categories: ['entertainment']
  },
  { 
    name: 'Tritium Bridge',
    url: 'https://bridge.terratritium.com',
    description: 'Cross-chain Bridge',
    indicator: 'hybrid',
    logo: '/public/logos/entertainment/terratritium.svg',
    categories: ['bridges']
  },
  { 
    name: 'Trust Wallet',
    url: 'https://trustwallet.com',
    description: 'Mobile Wallet',
    indicator: 'support',
    logo: '/public/logos/wallets/trustwallet.svg',
    categories: ['wallets']
  },
  { 
    name: 'Uniswap',
    url: 'https://app.uniswap.org/swap?outputCurrency=0xbd31ea8212119f94a611fa969881cba3ea06fa3d',
    description: 'Ethereum DEX',
    indicator: 'support',
    logo: '/public/logos/dex/uniswap.png',
    categories: ['dex']
  },
  { 
    name: 'Validator.Info',
    url: 'https://validator.info/terra-classic',
    description: 'Validator Info',
    indicator: 'support',
    logo: '/public/logos/validators/validatorinfo.svg',
    categories: ['validators', 'tools', 'information']
  },
  { 
    name: 'Validators Discord group',
    url: 'https://discord.com/invite/ARW627EU4P',
    description: 'Community Chat',
    indicator: 'support',
    logo: '/public/logos/validators/discord.svg',
    darkLogo: '/public/logos/validators/discord-dark.svg',
    categories: ['validators', 'information']
  },
  { 
    name: 'Validators Telegram group',
    url: 'https://t.me/transparentvalidatorchat',
    description: 'Community Chat',
    indicator: 'support',
    logo: '/public/logos/validators/telegram.svg',
    categories: ['validators', 'information']
  },
  { 
    name: 'Vultisig',
    url: 'https://vultisig.com',
    description: 'Multisig Wallet',
    indicator: 'support',
    logo: '/public/logos/wallets/vultisig.svg',
    categories: ['wallets']
  },
  { 
    name: 'Vyntrex',
    url: 'https://vyntrex.io',
    description: 'Aggregator',
    indicator: 'onchain',
    logo: '/public/logos/applications/vyntrex.svg',
    categories: ['applications']
  },
  { 
    name: 'WEEX',
    url: 'https://weex.com/trade/LUNC-USDT',
    description: 'Exchange',
    indicator: 'support',
    logo: '/public/logos/cex/weex.svg',
    categories: ['cex']
  },
  { 
    name: 'WESO DeFi',
    url: 'https://wesoworld.io',
    description: 'Decentralized Exchange',
    indicator: 'onchain',
    logo: '/public/logos/dex/wesoworld.png',
    categories: ['dex']
  },
];
