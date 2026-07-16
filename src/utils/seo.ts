export const SITE_ORIGIN = "https://terra-classic.io";
export const SITE_NAME = "Terra Classic";
export const SITE_ALTERNATE_NAME = "Terra Classic Ecosystem";
export const SITE_LOCALE = "en_US";
export const OG_IMAGE_URL = `${SITE_ORIGIN}/og-image.jpg`;
export const OG_IMAGE_TYPE = "image/jpeg";
export const OG_IMAGE_WIDTH = "1200";
export const OG_IMAGE_HEIGHT = "630";
export const OG_IMAGE_ALT = "Terra Classic — Explore. Build. Stake.";
export const LOGO_URL = `${SITE_ORIGIN}/favicon-512.png`;

export const HOME_TITLE =
  "Terra Classic — Ecosystem, LUNC, Wallets & Developer Docs";
export const HOME_DESCRIPTION =
  "Explore Terra Classic: wallets, validators, staking, LUNC and USTC tools, dApps, network infrastructure, governance, and developer documentation.";

export const PROJECT_MAP_TITLE =
  "Terra Classic Project Map — Explore the LUNC Ecosystem";
export const PROJECT_MAP_DESCRIPTION =
  "Explore Terra Classic wallets, validators, DeFi, infrastructure, and community projects through an interactive ecosystem map.";

export const absoluteUrl = (pathname: string): string => {
  if (!pathname || pathname === "/") {
    return `${SITE_ORIGIN}/`;
  }

  return `${SITE_ORIGIN}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
};

export const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_ORIGIN}/#website`,
      url: `${SITE_ORIGIN}/`,
      name: SITE_NAME,
      alternateName: SITE_ALTERNATE_NAME,
      description: HOME_DESCRIPTION,
      inLanguage: "en",
      publisher: {
        "@id": `${SITE_ORIGIN}/#organization`,
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_ORIGIN}/#organization`,
      url: `${SITE_ORIGIN}/`,
      name: "Terra Classic Community",
      alternateName: SITE_NAME,
      description:
        "The community of validators, builders, delegators, and contributors maintaining the Terra Classic ecosystem.",
      logo: {
        "@type": "ImageObject",
        url: LOGO_URL,
        width: 512,
        height: 512,
      },
    },
    {
      "@type": "CollectionPage",
      "@id": `${SITE_ORIGIN}/#webpage`,
      url: `${SITE_ORIGIN}/`,
      name: HOME_TITLE,
      description: HOME_DESCRIPTION,
      inLanguage: "en",
      isPartOf: {
        "@id": `${SITE_ORIGIN}/#website`,
      },
      about: [
        { "@type": "Thing", name: "Terra Classic" },
        { "@type": "Thing", name: "Luna Classic", alternateName: "LUNC" },
        { "@type": "Thing", name: "TerraClassicUSD", alternateName: "USTC" },
      ],
    },
  ],
};
