// Original artwork with dark strokes that disappear on the bubble map's dark canvas.
// Keep this explicit: colorful logos and logos with their own backing stay untouched.
const DARK_ARTWORK_LOGOS = new Set([
  "/logos/applications/base.png",
  "/logos/applications/terra-classic-money.png",
  "/logos/cex/bitget.png",
  "/logos/cex/btcc.png",
  "/logos/cex/bybit.svg",
  "/logos/cex/lbank.svg",
  "/logos/cex/phemex.svg",
  "/logos/dex/garuda.png",
  "/logos/entertainment/galacticshift.png",
  "/logos/for-developers/github.svg",
  "/logos/infrastructure/nownodes.svg",
  "/logos/tools/luncdash.png",
  "/logos/validators/discord.svg",
]);

export const needsLightLogoBacking = (
  mode: "light" | "dark",
  logoSrc?: string,
): boolean => mode === "dark" && Boolean(logoSrc && DARK_ARTWORK_LOGOS.has(logoSrc));
