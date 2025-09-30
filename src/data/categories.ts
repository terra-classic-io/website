export interface Category {
  title: string;
  description?: string;
}

export const categories: Record<string, Category> = {
  'for-developers': {
    title: 'For developers',
    description: 'Resources and tools for developers building on Terra Classic',
  },
  'infrastructure': {
    title: 'Infrastructure & service providers',
    description: 'Critical infrastructure services for the Terra Classic network',
  },
  'tools': {
    title: 'Blockchain tools',
    description: 'Tools for interacting with and analyzing the Terra Classic blockchain',
  },
  'bridges': {
    title: 'Bridges',
    description: 'Cross-chain bridges connecting Terra Classic to other blockchains',
  },
  'validators': {
    title: 'Validators',
    description: 'Validator communities and resources',
  },
  'entertainment': {
    title: 'Entertainment',
    description: 'Games and entertainment platforms built on Terra Classic',
  },
  'information': {
    title: 'Blockchain information',
    description: 'News and information sources about Terra Classic',
  },
  'wallets': {
    title: 'Wallets',
    description: 'Secure wallets for storing and managing your Terra Classic assets',
  },
  'cex': {
    title: 'Markets - CEX',
    description: 'Centralized exchanges where you can trade LUNC and USTC',
  },
  'dex': {
    title: 'Markets - DEX',
    description: 'Decentralized exchanges for trading Terra Classic assets',
  },
  'applications': {
    title: 'Applications',
    description: 'Applications and services built on Terra Classic',
  }
};
