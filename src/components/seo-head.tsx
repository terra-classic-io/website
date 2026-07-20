import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://terra-classic.io";
export const SITE_NAME = "Terra Classic";
export const OG_IMAGE_URL = `${SITE_URL}/og-v2.jpg`;

type StructuredData = Record<string, unknown> | readonly Record<string, unknown>[];

type SeoHeadProps = {
  readonly title: string;
  readonly description: string;
  readonly canonicalPath?: string;
  readonly type?: "website" | "article";
  readonly noIndex?: boolean;
  readonly modifiedTime?: string;
  readonly structuredData?: StructuredData;
};

const buildCanonicalUrl = (pathOrUrl: string): string => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${normalizedPath}`;
};

function SeoHead({
  title,
  description,
  canonicalPath = "/",
  type = "website",
  noIndex = false,
  modifiedTime,
  structuredData,
}: SeoHeadProps): JSX.Element {
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const robots = noIndex
    ? "noindex,nofollow"
    : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta name="application-name" content={SITE_NAME} />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={OG_IMAGE_URL} />
      <meta property="og:image:secure_url" content={OG_IMAGE_URL} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Terra Classic — Powering the future of digital money." />
      {type === "article" && modifiedTime ? (
        <meta property="article:modified_time" content={modifiedTime} />
      ) : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE_URL} />
      <meta name="twitter:image:alt" content="Terra Classic — Powering the future of digital money." />

      <link rel="canonical" href={canonicalUrl} />
      {structuredData ? (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      ) : null}
    </Helmet>
  );
}

export default SeoHead;
