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

