export type StablecoinAsset = {
  readonly symbol: string;
  readonly denom: string;
  readonly name: string;
  readonly currency: string;
  readonly glyph: string;
  readonly accent: string;
  readonly logo?: string;
};

/**
 * Terra Classic native asset followed by every fiat denomination exposed by
 * the chain's historical gas-price and oracle denomination set.
 */
export const stablecoinAssets: readonly StablecoinAsset[] = [
  { symbol: "LUNC", denom: "uluna", name: "Luna Classic", currency: "Luna", glyph: "L", accent: "#f59e0b", logo: "/logos/tokens/uluna.svg" },
  { symbol: "USTC", denom: "uusd", name: "TerraClassic USD", currency: "USD", glyph: "$", accent: "#2563eb", logo: "/logos/tokens/uusd.svg" },
  { symbol: "EUTC", denom: "ueur", name: "TerraClassic EUR", currency: "EUR", glyph: "€", accent: "#2563eb", logo: "/logos/tokens/ueur.svg" },
  { symbol: "JPTC", denom: "ujpy", name: "TerraClassic JPY", currency: "JPY", glyph: "¥", accent: "#ef4444", logo: "/logos/tokens/ujpy.svg" },
  { symbol: "KRTC", denom: "ukrw", name: "TerraClassic KRW", currency: "KRW", glyph: "₩", accent: "#16a34a", logo: "/logos/tokens/ukrw.svg" },
  { symbol: "CHTC", denom: "ucny", name: "TerraClassic CNH", currency: "CNH", glyph: "¥", accent: "#dc2626", logo: "/logos/tokens/ucny.svg" },
  { symbol: "SDTC", denom: "usdr", name: "TerraClassic SDR", currency: "SDR", glyph: "SDR", accent: "#7c3aed", logo: "/logos/tokens/usdr.svg" },
  { symbol: "MNTC", denom: "umnt", name: "TerraClassic MNT", currency: "MNT", glyph: "₮", accent: "#0f766e", logo: "/logos/tokens/umnt.svg" },
  { symbol: "GBTC", denom: "ugbp", name: "TerraClassic GBP", currency: "GBP", glyph: "£", accent: "#4f46e5", logo: "/logos/tokens/ugbp.svg" },
  { symbol: "INTC", denom: "uinr", name: "TerraClassic INR", currency: "INR", glyph: "₹", accent: "#ea580c", logo: "/logos/tokens/uinr.svg" },
  { symbol: "CATC", denom: "ucad", name: "TerraClassic CAD", currency: "CAD", glyph: "C$", accent: "#dc2626", logo: "/logos/tokens/ucad.svg" },
  { symbol: "CHFC", denom: "uchf", name: "TerraClassic CHF", currency: "CHF", glyph: "Fr", accent: "#e11d48", logo: "/logos/tokens/uchf.svg" },
  { symbol: "AUTC", denom: "uaud", name: "TerraClassic AUD", currency: "AUD", glyph: "A$", accent: "#0284c7", logo: "/logos/tokens/uaud.svg" },
  { symbol: "SGTC", denom: "usgd", name: "TerraClassic SGD", currency: "SGD", glyph: "S$", accent: "#e11d48", logo: "/logos/tokens/usgd.svg" },
  { symbol: "THTC", denom: "uthb", name: "TerraClassic THB", currency: "THB", glyph: "฿", accent: "#4338ca", logo: "/logos/tokens/uthb.svg" },
  { symbol: "SETC", denom: "usek", name: "TerraClassic SEK", currency: "SEK", glyph: "kr", accent: "#2563eb", logo: "/logos/tokens/usek.svg" },
  { symbol: "NOTC", denom: "unok", name: "TerraClassic NOK", currency: "NOK", glyph: "kr", accent: "#dc2626", logo: "/logos/tokens/unok.svg" },
  { symbol: "DKTC", denom: "udkk", name: "TerraClassic DKK", currency: "DKK", glyph: "kr", accent: "#dc2626", logo: "/logos/tokens/udkk.svg" },
  { symbol: "IDTC", denom: "uidr", name: "TerraClassic IDR", currency: "IDR", glyph: "Rp", accent: "#dc2626", logo: "/logos/tokens/uidr.svg" },
  { symbol: "PHTC", denom: "uphp", name: "TerraClassic PHP", currency: "PHP", glyph: "₱", accent: "#2563eb", logo: "/logos/tokens/uphp.svg" },
  { symbol: "HKTC", denom: "uhkd", name: "TerraClassic HKD", currency: "HKD", glyph: "HK$", accent: "#dc2626", logo: "/logos/tokens/uhkd.svg" },
  { symbol: "MYTC", denom: "umyr", name: "TerraClassic MYR", currency: "MYR", glyph: "RM", accent: "#eab308", logo: "/logos/tokens/umyr.svg" },
  { symbol: "TWTC", denom: "utwd", name: "TerraClassic TWD", currency: "TWD", glyph: "NT$", accent: "#2563eb", logo: "/logos/tokens/utwd.svg" },
] as const;
