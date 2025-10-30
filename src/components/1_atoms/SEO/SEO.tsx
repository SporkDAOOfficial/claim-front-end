import Head from "next/head";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterHandle?: string;
}

const SEO = ({
  title = "SporkDAO Patronage Claims",
  description = "Claim your SporkDAO patronage tokens. Connect your wallet to view eligibility and claim.",
  image = "https://claim.sporkdao.org/images/hero/SPORKDAO_coin_holo.png",
  url = "https://claim.sporkdao.org",
  type = "website",
  siteName = "SporkDAO Patronage Claims",
  twitterHandle = "@EthereumDenver",
}: SEOProps) => {
  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      <link rel="icon" type="image/svg+xml" href="/images/hero/SporkDAO_logo.svg" />
      <link rel="apple-touch-icon" href="/images/hero/SporkDAO_logo.svg" />
      <link rel="shortcut icon" href="/images/hero/SporkDAO_logo.svg" />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content={twitterHandle} />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="SporkDAO" />
      <meta name="theme-color" content="#A3CFFF" />
    </Head>
  );
};

export default SEO;

