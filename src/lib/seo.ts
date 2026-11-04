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
    title: "Shaba Crafts | Handmade Clothing, Bags & Sandals in Burundi",
    description: "Discover Shaba Crafts, a Burundian handmade fashion brand creating clothing, sandals, bags and accessories. Celebrate local craftsmanship and shop handmade products from Burundi.",
    path: "/",
    image: DEFAULT_IMAGE,
  },
  "/shop": {
    title: "Shop Handmade Products in Burundi | Shaba Crafts",
    description: "Browse handcrafted clothing, sandals, bags and accessories made in Burundi by Shaba Crafts. Discover handmade fashion and local craftsmanship.",
    path: "/shop",
    image: DEFAULT_IMAGE,
  },
  "/story": {
    title: "Our Story | Shaba Crafts",
    description: "Learn how Shaba Crafts celebrates Burundian craftsmanship through handmade fashion, local creativity, and contemporary design made in Burundi.",
    path: "/story",
    image: DEFAULT_IMAGE,
  },
  "/contact": {
    title: "Contact Shaba Crafts | Handmade Fashion in Burundi",
    description: "Contact Shaba Crafts for handmade fashion, custom orders, product questions, and collaborations rooted in Burundian craftsmanship.",
    path: "/contact",
    image: DEFAULT_IMAGE,
  },
  "/refund-policy": {
    title: "Returns & Exchange Policy | Shaba Crafts",
    description: "Read Shaba Crafts’ customer care and policy for handmade products made in Burundi, with support for exchanges and returns.",
    path: "/refund-policy",
    image: DEFAULT_IMAGE,
  },
  "/cart": {
    title: "Your Bag | Shaba Crafts",
    description: "Review your handmade products from Burundi before checkout and continue your order with Shaba Crafts.",
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
        title: `${product.name} | Shaba Crafts`,
        description: `${product.description} Handmade in Burundi and designed for everyday wear and craftsmanship.`,
        path: normalizedPath,
        image: product.image,
      };
    }
  }

  return {
    title: "Shaba Crafts | Handmade Clothing, Bags & Sandals in Burundi",
    description: "Discover Shaba Crafts, a Burundian handmade fashion brand creating clothing, sandals, bags and accessories. Celebrate local craftsmanship and shop handmade products from Burundi.",
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
      "Shaba Crafts creates handmade fashion, bags, sandals and accessories in Burundi with local craftsmanship, attention to detail, and contemporary design.",
    sameAs: [SHABA_BRAND.website],
  };
}
