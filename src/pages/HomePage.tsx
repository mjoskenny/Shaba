import { useEffect, useState } from "react";
import { Link } from "react-router";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";
import { getSectionMedia } from "../lib/site-content";

const Arrow = () => (
  <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path d="M5 12h14m-5-5 5 5-5 5" />
  </svg>
);

const GridViewIcon = ({ columns }: { columns: 1 | 2 | 3 | 4 }) => (
  <span aria-hidden="true" className={`grid-view-icon grid-view-icon-${columns}`}>
    {Array.from({ length: columns * 2 }, (_, index) => <i key={index} />)}
  </span>
);

export default function HomePage() {
  const { products } = useProducts();
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [productColumns, setProductColumns] = useState<2 | 3 | 4>(3);
  const [mobileColumns, setMobileColumns] = useState<1 | 2>(2);
  const [activeCategory, setActiveCategory] = useState("All pieces");
  const [audience, setAudience] = useState<"Women" | "Men">("Women");

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [activeCategory, audience]);

  const audienceProducts = products.filter((product) => product.audience.includes(audience));
  const categories = Array.from(new Set(audienceProducts.map((product) => product.category)));
  const visibleProducts = activeCategory === "All pieces"
    ? audienceProducts
    : audienceProducts.filter((product) => product.category === activeCategory);
  const heroImage = getSectionMedia("hero")[0]?.image ?? "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2200&q=88";
  const womenAudienceImage = getSectionMedia("audience-women")[0]?.image ?? "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1100&q=85";
  const menAudienceImage = getSectionMedia("audience-men")[0]?.image ?? "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1100&q=85";
  const mainFeatureImage = getSectionMedia("feature-main")[0]?.image ?? "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1500&q=85";
  const secondaryFeatureImage = getSectionMedia("feature-secondary")[0]?.image ?? "https://images.unsplash.com/photo-1473188588951-666fce8e7c68?auto=format&fit=crop&w=1000&q=85";
  const campaignImage = getSectionMedia("campaign")[0]?.image ?? "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=85";

  const selectAudience = (nextAudience: "Women" | "Men") => {
    setAudience(nextAudience);
    setActiveCategory("All pieces");
  };

  const selectCategory = (category: string) => {
    setActiveCategory(category);
    window.setTimeout(() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" }), 30);
  };

  return (
    <main className="home-page overflow-hidden bg-sand text-forest">
      <section className="home-minimal-hero relative isolate flex min-h-[620px] items-end overflow-hidden text-sand sm:min-h-[700px] lg:min-h-[min(780px,calc(100vh-3rem))]">
        <img
          alt="A considered look at contemporary African fashion"
          className="absolute inset-0 -z-20 size-full object-cover object-center"
          src={heroImage}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest/75 via-forest/25 to-transparent" />
        <div className="mx-auto w-full max-w-[1440px] px-5 pb-14 pt-40 sm:px-8 sm:pb-20 lg:px-14 lg:pb-24">
          <span className="home-minimal-kicker">SHABA CRAFTS <i /> MADE IN BURUNDI</span>
          <h1 className="mt-6 max-w-3xl text-5xl font-medium leading-[0.94] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
            Discover Handmade Fashion, Made in Burundi.
          </h1>
          <Link className="home-minimal-cta mt-8" to="/shop">Discover Shaba Crafts <Arrow /></Link>
        </div>
        <span className="absolute bottom-6 right-5 hidden text-[9px] uppercase tracking-[0.18em] text-sand/75 sm:block lg:right-14">Bujumbura · 2026</span>
      </section>

      <section aria-label="The SHABA difference" className="bg-[#eeeadf] px-5 py-7 sm:px-8 lg:px-14">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 sm:grid-cols-4">
          {[
            ["Made in Burundi", "Designed and made close to home"],
            ["Made with care", "Considered details, every time"],
            ["Wear it your way", "Clothing and pieces for everyday"],
            ["Here to help", "Personal service from our team"],
          ].map(([title, detail], index) => (
            <div className={`home-promise px-3 py-3 sm:px-5 sm:py-2 ${index % 2 ? "home-promise-alt" : ""}`} key={title}>
              <span className="home-promise-mark">0{index + 1}</span>
              <p className="mt-2 text-xs font-semibold tracking-[-0.02em] text-forest sm:text-sm">{title}</p>
              <p className="mt-1 max-w-[13rem] text-[10px] leading-4 text-forest/55 sm:text-xs">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-minimal-intro px-5 py-12 sm:px-8 sm:py-16 lg:px-14 lg:py-20">
        <div className="mx-auto grid max-w-[1440px] gap-5 sm:grid-cols-[0.7fr_1.3fr] sm:items-end sm:gap-10">
          <div className="flex flex-col gap-4">
            <span className="home-minimal-label">Rooted in Burundi</span>
            <Link className="inline-flex w-fit items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-forest transition hover:text-olive" to="/story">
              Our story <Arrow />
            </Link>
          </div>
          <p className="max-w-3xl text-xl leading-snug tracking-[-0.035em] text-forest/80 sm:text-2xl lg:text-[2rem]">
            At Shaba Crafts, we celebrate the creativity and craftsmanship of Burundi through handmade clothing, sandals, bags and accessories. Discover unique pieces made locally with attention to detail and a passion for handmade design.
          </p>
        </div>
      </section>

      <section aria-label="Shop for women or men" className="home-audience-section px-5 pb-14 sm:px-8 sm:pb-20 lg:px-14">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-3 sm:gap-5">
          {(["Women", "Men"] as const).map((item, index) => (
            <button
              aria-pressed={audience === item}
              className={`home-audience-card group relative aspect-[1.3] overflow-hidden text-left text-sand sm:aspect-[1.8] ${audience === item ? "home-audience-card-active" : ""}`}
              key={item}
              onClick={() => selectAudience(item)}
            >
              <img
                alt=""
                className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                src={index === 0 ? womenAudienceImage : menAudienceImage}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-forest/70 via-forest/5 to-transparent" />
              <span className="absolute bottom-4 left-4 flex items-center gap-3 sm:bottom-7 sm:left-7">
                <span className="text-2xl font-medium tracking-[-0.04em] sm:text-4xl">{item}</span>
                <span aria-hidden="true" className="home-audience-arrow grid size-8 place-items-center rounded-full border border-sand/70 sm:size-10"><Arrow /></span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section id="collection" className="home-minimal-products px-5 py-14 sm:px-8 sm:py-20 lg:px-14 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end sm:mb-9">
            <div>
              <span className="home-minimal-label">The collection</span>
              <h2 className="mt-2 text-3xl font-medium tracking-[-0.05em] sm:text-5xl">New and considered</h2>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div aria-label="Filter by category" className="home-minimal-filters flex max-w-[70vw] gap-1 overflow-x-auto sm:max-w-none">
                {["All pieces", ...categories].map((category) => (
                  <button
                    aria-pressed={activeCategory === category}
                    className="home-minimal-filter"
                    key={category}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <Link className="home-minimal-all hidden sm:inline-flex" to="/shop">View all <Arrow /></Link>
            </div>
          </div>

          <div className="home-minimal-tools mb-6 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.14em] text-forest/55">{audience} · {visibleProducts.length} pieces</span>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 sm:hidden" aria-label="Products per row on mobile">
                {([1, 2] as const).map((columns) => (
                  <button aria-label={`Show ${columns} products per row`} aria-pressed={mobileColumns === columns} className={`view-option ${mobileColumns === columns ? "view-option-active" : ""}`} key={columns} onClick={() => setMobileColumns(columns)}>
                    <GridViewIcon columns={columns} />
                  </button>
                ))}
              </div>
              <div className="hidden items-center gap-1 sm:flex" aria-label="Products per row on desktop">
                {([2, 3, 4] as const).map((columns) => (
                  <button aria-label={`Show ${columns} products per row`} aria-pressed={productColumns === columns} className={`view-option ${productColumns === columns ? "view-option-active" : ""}`} key={columns} onClick={() => setProductColumns(columns)}>
                    <GridViewIcon columns={columns} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`grid gap-x-3 gap-y-8 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 ${mobileColumns === 1 ? "grid-cols-1" : "grid-cols-2"} ${productColumns === 2 ? "lg:grid-cols-2" : productColumns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
            {visibleProducts.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
          {!visibleProducts.length && <p className="py-16 text-center text-sm text-forest/55">More pieces coming soon.</p>}
          <Link className="home-minimal-all mt-7 sm:hidden" to="/shop">View all pieces <Arrow /></Link>
        </div>
      </section>

      <section aria-label="Explore SHABA" className="home-feature-edits px-5 py-12 sm:px-8 sm:py-16 lg:px-14 lg:py-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6 flex items-end justify-between gap-5 sm:mb-8">
            <div>
              <span className="home-minimal-label">Made for real life</span>
              <h2 className="mt-2 text-3xl font-medium tracking-[-0.05em] sm:text-5xl">Find your SHABA</h2>
            </div>
            <span className="hidden text-[9px] uppercase tracking-[0.16em] text-forest/50 sm:block">Clothing · Everyday pieces</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1.25fr_0.75fr] sm:gap-5">
            <Link className="home-feature-tile group relative min-h-[280px] overflow-hidden bg-forest text-sand sm:min-h-[440px]" to="/shop">
              <img alt="Contemporary clothing in warm natural tones" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" src={mainFeatureImage} />
              <span className="absolute inset-0 bg-gradient-to-t from-forest/75 via-forest/10 to-transparent" />
              <span className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 sm:bottom-8 sm:left-8 sm:right-8">
                <span>
                  <span className="block text-[9px] uppercase tracking-[0.18em] text-sand/75">01 / The wardrobe</span>
                  <span className="mt-2 block text-3xl font-medium tracking-[-0.05em] sm:text-5xl">Clothing, with character.</span>
                </span>
                <span aria-hidden="true" className="home-feature-arrow grid size-10 shrink-0 place-items-center rounded-full border border-sand/70 sm:size-12"><Arrow /></span>
              </span>
            </Link>
            <div className="grid gap-3 sm:gap-5">
              <Link className="home-feature-tile group relative min-h-[190px] overflow-hidden bg-brass text-sand sm:min-h-0" to="/shop">
                <img alt="A considered leather accessory" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" src={secondaryFeatureImage} />
                <span className="absolute inset-0 bg-gradient-to-t from-forest/75 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 sm:bottom-6 sm:left-6 sm:right-6">
                  <span><span className="block text-[9px] uppercase tracking-[0.18em] text-sand/75">02 / Carry well</span><span className="mt-1 block text-2xl font-medium tracking-[-0.04em] sm:text-3xl">Everyday pieces</span></span>
                  <span aria-hidden="true" className="home-feature-arrow grid size-9 shrink-0 place-items-center rounded-full border border-sand/70"><Arrow /></span>
                </span>
              </Link>
              <Link className="home-feature-note flex min-h-[150px] flex-col items-start justify-between gap-4 p-5 sm:min-h-0 sm:p-7" to="/story">
                <span><span className="home-minimal-label">Bujumbura, Burundi</span><span className="mt-2 block max-w-xs text-xl font-medium leading-tight tracking-[-0.04em] sm:text-2xl">A local point of view, made to travel.</span></span>
                <span className="home-minimal-cta inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-forest">
                  Our story <Arrow />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="SHABA newsletter" className="home-newsletter-banner px-5 py-12 sm:px-8 sm:py-16 lg:px-14">
        <div className="mx-auto max-w-[1440px]">
          <div className="relative mx-auto max-w-[880px] overflow-hidden rounded-[1.75rem] border border-forest/10 bg-[#f9f5f0]/95 p-5 shadow-[0_18px_50px_rgba(23,37,30,0.08)] backdrop-blur-sm sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <span className="home-minimal-label text-forest/65">A note from SHABA</span>
                <h2 className="mt-3 max-w-xl text-2xl font-medium leading-tight tracking-[-0.05em] text-forest sm:text-4xl">Good things, now and then.</h2>
              </div>
              <div className="flex w-full max-w-[430px] items-stretch">
                <form className="flex w-full items-center gap-2 rounded-full border border-forest/10 bg-white/90 px-2 py-2 shadow-[0_6px_16px_rgba(23,37,30,0.04)]" onSubmit={(event) => { event.preventDefault(); setNewsletterSubmitted(true); }}>
                  <input aria-label="Email address" className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-forest outline-none placeholder:text-forest/45" placeholder="Your email address" required type="email" />
                  <button aria-label="Subscribe to SHABA updates" className="min-w-[150px] rounded-full border border-[#b68c52]/40 bg-[#b68c52] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition duration-200 hover:bg-[#a57d46]" type="submit">{newsletterSubmitted ? "Thank you" : "Join us"}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
