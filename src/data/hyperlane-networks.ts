import type { HyperlaneNetworkConfiguration } from "../types/hyperlane";

export const hyperlaneNetworkConfiguration = {
  source: {
    id: "terraclassic",
    name: "Terra Classic",
    domain: 132556,
    contracts: {
      validatorAnnounce: "terra1gtnmdevekgxpvzej3wfy20e2n335gm3muwj6geduxxa86j3x70cq00asmy",
      merkleTreeHook: "terra183lq6yqp8km3p34cxgk6k3u78uy4plqahey6rne7n9gy98delr9qyp0n2p",
    },
  },
  destinations: [
    {
      id: "bsc",
      name: "BNB Smart Chain",
      protocol: "evm",
      domain: 56,
      rpcEndpoints: ["https://bsc-rpc.publicnode.com"],
      ismAddress: "0xF6b0cDD33A7d2895a3F18b85569Ed9A8278cD151",
      ismExplorerUrl: "https://bscscan.com/address/0xF6b0cDD33A7d2895a3F18b85569Ed9A8278cD151",
    },
    {
      id: "ethereum",
      name: "Ethereum",
      protocol: "evm",
      domain: 1,
      rpcEndpoints: ["https://ethereum-rpc.publicnode.com"],
      ismAddress: "0x3ba17675f0D319C89D70722f6eb07790DF0B254B",
      ismExplorerUrl: "https://etherscan.io/address/0x3ba17675f0D319C89D70722f6eb07790DF0B254B",
    },
    {
      id: "solana",
      name: "Solana",
      protocol: "solana",
      domain: 1399811149,
      rpcEndpoints: ["https://api.mainnet-beta.solana.com"],
      ismAddress: "4MzF7HCfxuwj4EFHqZSEpvkcZZvv1mF37DP4pDHwR5VQ",
      validatorSetAccount: "7YypjZXNWQhRGJXr1TWZYaf4PdiFSmbbrANGieFUV1gJ",
      ismExplorerUrl: "https://solscan.io/account/4MzF7HCfxuwj4EFHqZSEpvkcZZvv1mF37DP4pDHwR5VQ",
    },
  ],
} satisfies HyperlaneNetworkConfiguration;
