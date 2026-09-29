// Inventory provenance: deployment guide linked below and governance proposal 12229.
// Addresses are references to query, never evidence of current ownership by themselves.
export const deploymentSource =
  "https://github.com/terra-classic-hyperlane/cw-hyperlane/blob/main/terraclassic/doc/HYPERLANE_DEPLOYMENT-MAINNET_EN.md";
export const safeAddress = "0x4d78A2182a7Cd3a370D73E6651EF4B32C2dd8BDb";
export const terraGovernanceAddress =
  "terra10d07y265gmmuvt4z0w9aw880jnsr700juxf95n";
export const squads = {
  program: "SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf",
  multisig: "De1McrvkHNCTs8aYrirqdRVyWcK7DTtEJyMnqGe7gVhr",
  vault: "UyvAB4vzpbzUfSQP4uStLPz2Td1coSJcosCRGV4vHmr",
  rpc: "https://api.mainnet-beta.solana.com",
  url: "https://app.squads.so",
};
export const terraContracts = [
  {
    label: "Mailbox",
    address: "terra1fwg35n5esjgny7d8pxnz8usjpwsvpguk0txsy6cnqxy58x9fdlksjpx3p9",
    monitor: true,
  },
  {
    label: "Routing ISM",
    address: "terra1uhzzvt9x3u8hjnkp695hklexx2uywjvfqv454d93ds92sgtpwk7qrpxdg0",
    monitor: true,
  },
  {
    label: "Ethereum ISM",
    address: "terra187rzjc3dznfxqtqqrwh796e5q4khmvp5av8mka6zhp98zjfk2z2qneldar",
  },
  {
    label: "BSC ISM",
    address: "terra1nqj7qlnt2sty0dgnu3ss5z4u6wr7hjfea7cn6wpwjt2uymts8ucsmuj9xw",
  },
  {
    label: "Solana ISM",
    address: "terra10s3p36tjek8amhlc4krxpzln6g8n0qy9jq82wyda434l3rv89wfsucl50t",
  },
  {
    label: "Default aggregation hook",
    address: "terra1026v947k2jn58t09ppw003xujj92vp3lxv0fg3xk8ccz42r8d2sqvnmvel",
  },
  {
    label: "IGP",
    address: "terra1taunhg629rssf3g939nqr0h594q5mssrzdj5lkx2hygmxmh72ghqeqqnvz",
    monitor: true,
  },
  {
    label: "Required aggregation hook",
    address: "terra1xmdd7yhu3qdlfhrcku8srfvtday6efymj54gqz0daxsmn8pvqygq0nxq04",
  },
  {
    label: "Pausable hook",
    address: "terra1x8s9qtw9355pfckywkns4e8f9zyfjaf8w5e5s8vh28ph5gzwwlks9tjcnf",
  },
  {
    label: "Fee hook",
    address: "terra1sud5xyknr93wmxem6kxdfd0vxcju47wuh7zdm5uecavrm36w669sp7j8ag",
  },
  {
    label: "LUNC Warp",
    address: "terra1m7jcqxfn4hd7q4sywhw508nxshaf078c4vh83y0ts43y9tlp9dcs50cggy",
    monitor: true,
  },
  {
    label: "USTC Warp",
    address: "terra1qu3x6vhk4y6w6erhmedzfp2ug53qm5nwpyarxveqa7tvwg0telxqvd3ccf",
    monitor: true,
  },
  {
    label: "Validator Announce",
    address: "terra1gtnmdevekgxpvzej3wfy20e2n335gm3muwj6geduxxa86j3x70cq00asmy",
  },
  {
    label: "Merkle hook",
    address: "terra183lq6yqp8km3p34cxgk6k3u78uy4plqahey6rne7n9gy98delr9qyp0n2p",
  },
] as const;

export const evmAdministration = [
  {
    id: "bsc",
    name: "BNB Smart Chain",
    prefix: "bnb",
    service: "https://api.safe.global/tx-service/bnb",
    rpc: "https://bsc-dataseed.binance.org",
    explorer: "https://bscscan.com",
    contracts: [
      ["Warp ISM", "0xF6b0cDD33A7d2895a3F18b85569Ed9A8278cD151"],
      ["Warp IGP", "0xEdEd7a4f6FEe4B474B9d7730Bf3465E35E2a4923"],
      ["LUNC Warp", "0x481095ecEd7A907e7f390b6226F53a66D379e6e2"],
      ["USTC Warp", "0xfC067fd98FD123fC2cAd72d040AF60a523274339"],
      ["LUNC ProxyAdmin", "0x002a1821aff44c12084bc13f3c5cf442720c127c"],
      ["USTC ProxyAdmin", "0x60c92c612d0e7befd188043d557756fef07f725f"],
    ],
  },
  {
    id: "ethereum",
    name: "Ethereum",
    prefix: "eth",
    service: "https://api.safe.global/tx-service/eth",
    rpc: "https://ethereum-rpc.publicnode.com",
    explorer: "https://etherscan.io",
    contracts: [
      ["Warp ISM", "0x3ba17675f0D319C89D70722f6eb07790DF0B254B"],
      ["Warp IGP", "0x9650F1f8DB492750323172145e67Df4e89E964Aa"],
      ["LUNC Warp", "0xA4bc47a4C5461eB0E59A585a21A1222EF7544Ac6"],
      ["USTC Warp", "0xf49408beb319aeCe3E8B3550a5C750C19b3F1e51"],
      ["LUNC ProxyAdmin", "0x8c7a816d2c5d4dd480d7267caa46769a3c9fa2b5"],
      ["USTC ProxyAdmin", "0xfbb065fcb26a7a74e5c1f187ae9a45a7d80a51c1"],
    ],
  },
] as const;
