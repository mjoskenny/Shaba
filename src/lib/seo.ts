import { SHABA_BRAND } from "./brand";
import { products } from "../data";

const BASE_URL = "https://www.shabacrafts.store";
const DEFAULT_IMAGE = `${BASE_URL}/shaba-wordmark-mask.png`;

export type SeoConfig = {
  title: string;
  description: string;
  path: string;
  image?: string;
};

const pageDefaults: Record<string, SeoConfig> = {
  "/": {
    title: "SHABA | Crafted in Burundi",
    description: "SHABA creates contemporary leather goods and everyday essentials in Burundi with thoughtful design, honest materials, and lasting craftsmanship.",
    path: "/",
    image: DEFAULT_IMAGE,
  },
  "/shop": {
    title: "Shop SHABA | Leather Goods & Everyday Essentials",
    description: "Browse SHABA’s handcrafted leather bags, wallets, and sandals made in Burundi for daily life and slow, intentional living.",
    path: "/shop",
    image: DEFAULT_IMAGE,
  },
  "/story": {
    title: "Our Story | SHABA",
    description: "Learn how SHABA brings Burundian craft, material care, and contemporary design together in a slow, meaningful collection.",
    path: "/story",
    image: DEFAULT_IMAGE,
  },
  "/contact": {
    title: "Contact SHABA | Questions, Orders & Collaborations",
    description: "Get in touch with SHABA for product questions, custom orders, and collaborations. We’re based in Bujumbura, Burundi.",
    path: "/contact",
    image: DEFAULT_IMAGE,
  },
  "/refund-policy": {
    title: "Returns & Exchange Policy | SHABA",
    description: "Read SHABA’s customer care, return, and exchange policy for orders from our Burundian-made collection.",
    path: "/refund-policy",
    image: DEFAULT_IMAGE,
  },
  "/cart": {
    title: "Your Bag | SHABA",
    description: "Review your SHABA order before checkout and keep track of the pieces you’ve chosen for your everyday essentials.",
    path: "/cart",
    image: DEFAULT_IMAGE,
  },
};

export function getSeoConfigFromPath(pathname: string): SeoConfig {
  const normalizedPath = pathname.split("?")[0].split("#")[0] || "/";
  const staticMatch = pageDefaults[normalizedPath];
  if (staticMatch) return staticMatch;

  const productMatch = normalizedPath.match(/^\/products\/([^/]+)/);
  if (productMatch) {
    const product = products.find((item) => item.slug === productMatch[1]);
    if (product) {
      return {
        title: `${product.name} | SHABA`,
        description: product.description,
        path: normalizedPath,
        image: product.image,
      };
    }
  }

  return {
    title: "SHABA | Crafted in Burundi",
    description: "SHABA creates contemporary leather goods and everyday essentials in Burundi with thoughtful design, honest materials, and lasting craftsmanship.",
    path: normalizedPath,
    image: DEFAULT_IMAGE,
  };
}

export function applySeo(config: SeoConfig) {
  if (typeof document === "undefined") return;

  const url = `${BASE_URL}${config.path === "/" ? "" : config.path}`;

  const setMeta = (selector: string, value: string, attribute = "content") => {
    let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement("meta");
      if (selector.includes('property="')) {
        const property = selector.match(/property="([^"]+)"/)?.[1];
        if (property) tag.setAttribute("property", property);
      }
      if (selector.includes('name="')) {
        const name = selector.match(/name="([^"]+)"/)?.[1];
        if (name) tag.setAttribute("name", name);
      }
      document.head.appendChild(tag);
    }
    tag.setAttribute(attribute, value);
  };

  document.title = config.title;
  setMeta('meta[name="description"]', config.description);
  setMeta('meta[name="robots"]', "index, follow, max-image-preview:large");
  setMeta('meta[property="og:title"]', config.title);
  setMeta('meta[property="og:description"]', config.description);
  setMeta('meta[property="og:url"]', url);
  setMeta('meta[property="og:image"]', config.image ?? DEFAULT_IMAGE);
  setMeta('meta[property="og:site_name"]', SHABA_BRAND.name);
  setMeta('meta[property="og:locale"]', "en_US");
  setMeta('meta[name="twitter:title"]', config.title);
  setMeta('meta[name="twitter:description"]', config.description);
  setMeta('meta[name="twitter:image"]', config.image ?? DEFAULT_IMAGE);

  let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: SHABA_BRAND.name,
    url: SHABA_BRAND.website,
    logo: `${SHABA_BRAND.website}/shaba-wordmark-mask.png`,
    image: `${SHABA_BRAND.website}/shaba-wordmark-mask.png`,
    telephone: SHABA_BRAND.contactNumber,
    email: SHABA_BRAND.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bujumbura",
      addressCountry: "BI",
    },
    description:
      "SHABA creates contemporary leather goods and everyday essentials in Burundi with thoughtful design, honest materials, and lasting craftsmanship.",
    sameAs: [SHABA_BRAND.website],
  };
}
