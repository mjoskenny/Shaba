export type Product = {
  slug: string;
  name: string;
  category: string;
  audience: string[];
  price: string;
  image: string;
  description: string;
  inventory?: number;
  published?: boolean;
  sizes?: string[];
};

export const products: Product[] = [
  {
    slug: "bujumbura-cross",
    name: "Bujumbura Cross",
    category: "Sandals",
    audience: ["Women", "Men"],
    price: "145,000 BIF",
    image: "https://images.unsplash.com/photo-1613662632164-7f2b081a5b46?auto=format&fit=crop&w=1200&q=88",
    description: "A quietly confident sandal cut from full-grain leather, shaped for everyday movement and finished by hand in Bujumbura.",
    sizes: ["36", "37", "38", "39", "40", "41", "42"],
  },
  {
    slug: "imboneza-satchel",
    name: "Imboneza Satchel",
    category: "Bags",
    audience: ["Women"],
    price: "320,000 BIF",
    image: "https://images.unsplash.com/photo-1473188588951-666fce8e7c68?auto=format&fit=crop&w=1200&q=88",
    description: "A structured daily satchel with considered compartments, solid brass hardware, and a rich patina that deepens over time.",
    sizes: ["One size"],
  },
  {
    slug: "amahoro-wallet",
    name: "Amahoro Wallet",
    category: "Small goods",
    audience: ["Men"],
    price: "85,000 BIF",
    image: "https://images.unsplash.com/photo-1635100299010-0410d7434a93?auto=format&fit=crop&w=1200&q=88",
    description: "Slim, practical, and precisely stitched, the Amahoro carries the essentials without unnecessary bulk.",
    sizes: ["One size"],
  },
  {
    slug: "ruzizi-carryall",
    name: "Ruzizi Carryall",
    category: "Bags",
    audience: ["Women", "Men"],
    price: "410,000 BIF",
    image: "https://images.unsplash.com/photo-1525103504173-8dc1582c7430?auto=format&fit=crop&w=1200&q=88",
    description: "A generous unisex carryall made for overnight journeys, with reinforced handles and an easy, enduring silhouette.",
    sizes: ["One size"],
  },
];

export const craftImages = {
  tools: "https://images.unsplash.com/photo-1628483211662-9bcc692c46dc?auto=format&fit=crop&w=1400&q=88",
  bench: "https://images.unsplash.com/photo-1647502191516-68a4f8c74ed4?auto=format&fit=crop&w=1400&q=88",
  detail: "https://images.unsplash.com/photo-1496180317060-d2026272f138?auto=format&fit=crop&w=1400&q=88",
};
