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

export const defaultStoryContent: StoryContent = {
  eyebrow: "Our roots",
  title: "Burundian roots. Timeless perspective.",
  intro: "SHABA began with a simple belief: the objects we carry can hold the identity, skill, and ambition of the place where they are made.",
  image: "",
  secondaryTitle: "A modern expression of local craft.",
  secondaryCopy: "Every collection begins in Bujumbura. We draw from the clarity of the landscape, the rhythm of city life, and the skill of people who know how to make useful things well.",
  secondaryCopyTwo: "From clothing to leather goods, we carry Burundian creativity forward through thoughtful design, lasting materials, and meaningful work.",
  valuesTitle: "Build locally. Design openly. Make things worth keeping.",
  futureTitle: "A Burundian house with a global horizon.",
  futureCopy: "We are building SHABA slowly and deliberately: expanding skills, creating meaningful local opportunities, and showing that contemporary African design can be both deeply rooted and confidently international. Every object is part of that longer story.",
};

