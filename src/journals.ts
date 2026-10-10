import { craftImages } from "./data";

export type JournalEntry = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  body: string[];
  published?: boolean;
};

export const fallbackJournals: JournalEntry[] = [
  {
    slug: "leather-that-lives",
    category: "Materials",
    title: "Why full-grain leather gets better with time",
    excerpt: "A closer look at patina, natural character, and why we choose leather that records the life lived with it.",
    image: craftImages.detail,
    body: [
      "Full-grain leather keeps the strongest, most expressive surface of the hide intact. Its marks and subtle variations are not defects; they are the beginning of a material that becomes more personal with use.",
      "Over time, sunlight, movement, and the oils from your hands deepen its tone and soften its structure. This evolving finish is called patina.",
      "We finish our leather lightly so the material can continue to breathe and change. The result is an object that does not merely resist time—it responds to it.",
    ],
    published: true,
  },
  {
    slug: "inside-the-bujumbura-workshop",
    category: "Studio notes",
    title: "Inside a day at the Bujumbura workshop",
    excerpt: "From the first pattern to the last polished edge, follow the steady rhythm behind every SHABA piece.",
    image: craftImages.tools,
    body: [
      "The workshop begins quietly. Patterns are checked, hides are laid out, and every cut is planned before a blade meets leather.",
      "The day moves between focused individual work and shared inspection. Nothing is hurried because every later step depends on the accuracy of the one before it.",
      "By evening, finished pieces sit beside work still in progress—a visible record of patient skill and collective attention.",
    ],
    published: true,
  },
];
