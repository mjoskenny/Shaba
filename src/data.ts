export type Product = {
  slug: string;
  name: string;
  category: string;
  audience: string[];
  price: string;
  image: string;
  images?: string[];
  description: string;
  inventory?: number;
  published?: boolean;
  sizes?: string[];
};

export function normalizeProductSizes(value: unknown): string[] {
  const entries = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const sizes = entries
    .filter((size): size is string => typeof size === "string")
    .flatMap((size) => {
      const commaSeparated = size.split(",").map((part) => part.trim()).filter(Boolean);
      return commaSeparated.flatMap((part) => /^\d+(?:\s+\d+)+$/.test(part) ? part.split(/\s+/) : [part]);
    });

  return sizes.length ? [...new Set(sizes)] : ["One size"];
}

export const craftImages = {
  tools: "https://images.unsplash.com/photo-1628483211662-9bcc692c46dc?auto=format&fit=crop&w=1400&q=88",
  bench: "https://images.unsplash.com/photo-1647502191516-68a4f8c74ed4?auto=format&fit=crop&w=1400&q=88",
  detail: "https://images.unsplash.com/photo-1496180317060-d2026272f138?auto=format&fit=crop&w=1400&q=88",
};
