export type SiteMediaSection =
  | "hero"
  | "audience-women"
  | "audience-men"
  | "feature-main"
  | "feature-secondary"
  | "campaign";

export type SiteMediaItem = {
  id: string;
  section: SiteMediaSection;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  alt: string;
};

export type StoryContent = {
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  secondaryTitle: string;
  secondaryCopy: string;
  secondaryCopyTwo: string;
  valuesTitle: string;
  futureTitle: string;
  futureCopy: string;
};

export const siteMediaSections = [
  { value: "hero", label: "Hero" },
  { value: "audience-women", label: "Women audience" },
  { value: "audience-men", label: "Men audience" },
  { value: "feature-main", label: "Main feature tile" },
  { value: "feature-secondary", label: "Secondary feature tile" },
  { value: "campaign", label: "Campaign image" },
] as const;

const STORAGE_KEY = "shaba-site-content-v1";

export const defaultSiteContent: SiteMediaItem[] = [
  {
    id: "hero-default",
    section: "hero",
    title: "A sense of place.",
    subtitle: "A style of your own.",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2200&q=88",
    href: "/shop",
    alt: "SHABA home hero photography featuring contemporary African fashion",
  },
  {
    id: "audience-women-default",
    section: "audience-women",
    title: "Women",
    subtitle: "Contemporary pieces designed for everyday movement.",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1100&q=85",
    href: "/shop",
    alt: "Women's SHABA collection",
  },
  {
    id: "audience-men-default",
    section: "audience-men",
    title: "Men",
    subtitle: "Considered staples with ease and structure.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1100&q=85",
    href: "/shop",
    alt: "Men's SHABA collection",
  },
  {
    id: "feature-main-default",
    section: "feature-main",
    title: "The wardrobe",
    subtitle: "Clothing, with character.",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1500&q=85",
    href: "/shop",
    alt: "SHABA wardrobe photography",
  },
  {
    id: "feature-secondary-default",
    section: "feature-secondary",
    title: "Carry well",
    subtitle: "Everyday pieces",
    image: "https://images.unsplash.com/photo-1473188588951-666fce8e7c68?auto=format&fit=crop&w=1000&q=85",
    href: "/shop",
    alt: "A leather accessory from SHABA",
  },
  {
    id: "campaign-default",
    section: "campaign",
    title: "Made for your everyday.",
    subtitle: "Made in Burundi",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=85",
    href: "/story",
    alt: "Campaign image for SHABA made in Burundi",
  },
];

export function getSiteMedia(): SiteMediaItem[] {
  if (typeof window === "undefined") return defaultSiteContent;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSiteContent;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultSiteContent;
  } catch {
    return defaultSiteContent;
  }
}

export function saveSiteMedia(items: SiteMediaItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function createSiteMediaEntry(overrides: Partial<SiteMediaItem> = {}): SiteMediaItem {
  return {
    id: `shaba-media-${Math.random().toString(36).slice(2, 10)}`,
    section: "hero",
    title: "",
    subtitle: "",
    image: "",
    href: "/shop",
    alt: "",
    ...overrides,
  };
}

export function getSectionMedia(section: SiteMediaSection): SiteMediaItem[] {
  return getSiteMedia().filter((item) => item.section === section);
}

export const defaultStoryContent: StoryContent = {
  eyebrow: "Our roots",
  title: "Burundian roots. Timeless perspective.",
  intro: "SHABA began with a simple belief: the objects we carry can hold the identity, skill, and ambition of the place where they are made.",
  image: "https://images.unsplash.com/photo-1591216491474-a22d5296fe98?auto=format&fit=crop&w=1400&q=90",
  secondaryTitle: "A modern expression of local craft.",
  secondaryCopy: "Every collection begins in Bujumbura. We draw from the clarity of the landscape, the rhythm of city life, and the skill of people who know how to make useful things well.",
  secondaryCopyTwo: "From clothing to leather goods, we carry Burundian creativity forward through thoughtful design, lasting materials, and meaningful work.",
  valuesTitle: "Build locally. Design openly. Make things worth keeping.",
  futureTitle: "A Burundian house with a global horizon.",
  futureCopy: "We are building SHABA slowly and deliberately: expanding skills, creating meaningful local opportunities, and showing that contemporary African design can be both deeply rooted and confidently international. Every object is part of that longer story.",
};

const STORY_STORAGE_KEY = "shaba-story-content-v1";

export function getStoryContent(): StoryContent {
  if (typeof window === "undefined") return defaultStoryContent;

  try {
    const raw = window.localStorage.getItem(STORY_STORAGE_KEY);
    if (!raw) return defaultStoryContent;
    const parsed = JSON.parse(raw) as Partial<StoryContent>;
    return { ...defaultStoryContent, ...parsed };
  } catch {
    return defaultStoryContent;
  }
}

export function saveStoryContent(content: StoryContent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(content));
}
