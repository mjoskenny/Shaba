import { useEffect, useState } from "react";
import { Link } from "react-router";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";

const Icon = () => {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  );
};

const GridViewIcon = ({ columns }: { columns: 1 | 2 | 3 | 4 }) => (
  <span
    aria-hidden="true"
    className={`grid-view-icon grid-view-icon-${columns}`}
  >
    {Array.from({ length: columns * 2 }, (_, index) => (
      <i key={index} />
    ))}
  </span>
);

export default function App() {
  const { products } = useProducts();
  const [notice, setNotice] = useState("");
  const [productColumns, setProductColumns] = useState<2 | 3 | 4>(2);
  const [mobileColumns, setMobileColumns] = useState<1 | 2>(2);
  const [activeCategory, setActiveCategory] = useState("New arrivals");
  const [audience, setAudience] = useState<"Women" | "Men">("Women");

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [activeCategory]);

  const audienceProducts = products.filter((product) =>
    product.audience.includes(audience),
  );

  const visibleProducts =
    activeCategory === "New arrivals"
      ? audienceProducts
      : audienceProducts.filter((product) => product.category === activeCategory);

  const selectAudience = (nextAudience: "Women" | "Men") => {
    setAudience(nextAudience);
    setActiveCategory("New arrivals");
    window.setTimeout(() => {
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <main id="top" className="overflow-hidden bg-sand text-forest">
      <section className="hero-grid">
        <div className="relative flex min-h-[760px] items-end overflow-hidden sm:min-h-[860px] lg:min-h-[calc(100vh+60px)]">
          <img
            alt="Hand-finished brown leather sandals"
            className="hero-media absolute inset-0 size-full object-cover object-center"
            src="https://images.unsplash.com/photo-1605445175147-8d2340ea9065?auto=format&fit=crop&w=1400&q=90"
          />
          <div className="absolute inset-0 bg-forest/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/35 to-forest/25" />
          <div className="hero-copy relative max-w-2xl p-7 pb-16 text-sand sm:p-14 lg:p-20 lg:pb-24">
            <span className="eyebrow text-gold">The debut collection · 2025</span>
            <h1 className="mt-6 font-serif text-5xl leading-[0.98] sm:text-7xl lg:text-[88px]">
              Made by hand.
              <br />
              Made to live.
            </h1>
            <p className="mt-7 max-w-md text-sm leading-7 text-sand/80 sm:text-base">
              Timeless leather goods, thoughtfully crafted in Burundi for every road ahead.
            </p>
            <Link className="button button-light hero-button mt-9" to="/shop">
              Explore the collection <Icon />
            </Link>
          </div>
        </div>

        <div className="relative hidden min-h-[860px] bg-olive lg:block">
          <img
            alt="Leather artisan tools and hand-cut materials"
            className="hero-media hero-media-delayed absolute inset-0 size-full object-cover opacity-75 mix-blend-multiply"
            src="https://images.unsplash.com/photo-1628483211662-9bcc692c46dc?auto=format&fit=crop&w=1200&q=90"
          />
          <div className="absolute inset-0 bg-forest/30" />
          <div className="brand-pattern absolute right-12 top-12" />
          <div className="absolute bottom-14 left-14 right-14 flex items-end justify-between border-t border-sand/50 pt-5 text-sand">
            <p className="max-w-xs font-serif text-3xl leading-tight">The soul of Burundi, shaped in leather.</p>
            <span className="text-[10px] uppercase tracking-[0.22em]">01 — Origin</span>
          </div>
        </div>
      </section>

      <section className="audience-selector bg-sand px-5 pb-2 pt-8 sm:px-8 lg:px-14">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-2">
          {(["Women", "Men"] as const).map((item) => (
            <button
              aria-pressed={audience === item}
              className={`audience-button ${audience === item ? "audience-button-active" : ""}`}
              key={item}
              onClick={() => selectAudience(item)}
            >
              <strong>{item}</strong>
            </button>
          ))}
        </div>
      </section>

      <section id="shop" className="bg-sand px-5 pb-24 pt-10 sm:px-8 sm:pt-12 lg:px-14 lg:pb-32 lg:pt-14">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 flex flex-col justify-between gap-8 sm:flex-row sm:items-end" data-reveal>
            <div>
              <span className="eyebrow text-brass">Essentials, elevated</span>
              <h2 className="mt-4 font-serif text-5xl text-brass sm:text-6xl">{audience} · {activeCategory}</h2>
              <div className="palette-rule mt-6" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-7">
              <div className="flex items-center gap-2 sm:hidden" aria-label="Products per row on mobile">
                <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-forest/50">View</span>
                {([1, 2] as const).map((columns) => (
                  <button
                    aria-label={`Show ${columns} product${columns > 1 ? "s" : ""} per row`}
                    aria-pressed={mobileColumns === columns}
                    className={`view-option ${mobileColumns === columns ? "view-option-active" : ""}`}
                    key={columns}
                    onClick={() => setMobileColumns(columns)}
                  >
                    <GridViewIcon columns={columns} />
                  </button>
                ))}
              </div>
              <div className="hidden items-center gap-2 sm:flex" aria-label="Products per row on desktop">
                <span className="mr-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-forest/50">View</span>
                {([2, 3, 4] as const).map((columns) => (
                  <button
                    aria-label={`Show ${columns} products per row`}
                    aria-pressed={productColumns === columns}
                    className={`view-option ${productColumns === columns ? "view-option-active" : ""}`}
                    key={columns}
                    onClick={() => setProductColumns(columns)}
                  >
                    <GridViewIcon columns={columns} />
                  </button>
                ))}
              </div>
              <Link className="underlined-link" to="/shop">View all pieces <Icon /></Link>
            </div>
          </div>

          <div className="collection-tabs mb-10 lg:mb-14" data-reveal>
            {["New arrivals", ...Array.from(new Set(audienceProducts.map((product) => product.category)))].map((category) => (
              <button
                className={`collection-tab ${activeCategory === category ? "collection-tab-active" : ""}`}
                key={category}
                onClick={() => setActiveCategory(category)}
              >
                <span>{category}</span>
                <small>
                  {category === "New arrivals"
                    ? audienceProducts.length
                    : audienceProducts.filter((product) => product.category === category).length}
                </small>
              </button>
            ))}
          </div>

          <div
            className={`grid gap-x-3 gap-y-10 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-12 ${
              mobileColumns === 1 ? "grid-cols-1" : "grid-cols-2"
            } ${
              productColumns === 2
                ? "lg:grid-cols-2"
                : productColumns === 3
                  ? "lg:grid-cols-3"
                  : "lg:grid-cols-4"
            }`}
          >
            {visibleProducts.map((product) => (
              <div data-reveal key={product.slug}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brass text-sand" data-reveal>
        <div className="mx-auto grid max-w-[1440px] sm:grid-cols-3">
          {[
            ["01", "Made by hand", "Designed and finished by skilled local hands."],
            ["02", "Fast local delivery", "Complimentary in Bujumbura over 200,000 BIF."],
            ["03", "Made to be kept", "Care guidance and repairs for a longer life."],
          ].map(([number, title, description]) => (
            <div className="service-promise" key={title}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="story" className="bg-forest text-sand">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[520px] lg:min-h-[760px]" data-reveal>
            <img
              alt="Green hills and lake reflecting Burundi's natural landscape"
              className="absolute inset-0 size-full object-cover"
              src="https://images.unsplash.com/photo-1591216491474-a22d5296fe98?auto=format&fit=crop&w=1400&q=90"
            />
            <div className="absolute inset-0 bg-forest/25" />
            <span className="absolute bottom-7 left-7 text-[10px] uppercase tracking-[0.22em] sm:bottom-12 sm:left-12">
              Inspired by home
            </span>
          </div>
          <div className="relative flex items-center px-7 py-20 sm:px-14 lg:px-20" data-reveal>
            <div className="brand-pattern absolute right-10 top-10 opacity-60" />
            <div className="relative max-w-xl">
              <span className="eyebrow text-gold">Our roots</span>
              <h2 className="mt-7 font-serif text-5xl leading-[1.05] sm:text-7xl">
                Quality leather.
                <br />
                Burundian roots.
                <br />
                Timeless style.
              </h2>
              <div className="my-9 h-px w-16 bg-gold" />
              <p className="max-w-lg text-sm leading-7 text-sand/70 sm:text-base sm:leading-8">
                SHABA was born from a belief that the objects we carry should tell a deeper story. Each piece is designed in Bujumbura and finished by skilled hands, blending enduring materials with a distinctly modern spirit.
              </p>
              <Link className="button button-light mt-9" to="/story">
                Discover our story <Icon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="craft" className="bg-[#e4ded2] px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
        <div className="mx-auto grid max-w-[1440px] items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="max-w-md" data-reveal>
            <span className="eyebrow text-brass">Made with intention</span>
            <h2 className="mt-5 font-serif text-5xl leading-tight sm:text-6xl">Craft that gets better with time.</h2>
            <p className="mt-7 text-sm leading-7 text-forest/65">
              From the first cut to the final stitch, our process is patient, precise, and rooted in respect for material.
            </p>
            <Link className="underlined-link mt-8" to="/craft">Inside the workshop <Icon /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4" data-reveal>
            <img
              alt="Leather craft tools arranged on a worktable"
              className="mt-16 aspect-[4/5] size-full object-cover"
              src="https://images.unsplash.com/photo-1628483211662-9bcc692c46dc?auto=format&fit=crop&w=800&q=85"
            />
            <img
              alt="Artisan tracing a leather pattern by hand"
              className="aspect-[4/5] size-full object-cover"
              src="https://images.unsplash.com/photo-1787005241178-c9006ea9610b?auto=format&fit=crop&w=800&q=85"
            />
          </div>
        </div>
      </section>

      <section id="journal" className="border-b border-sand/15 bg-olive px-5 py-20 text-sand sm:px-8 lg:px-14">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center text-center">
          <span className="eyebrow text-gold">Notes from SHABA</span>
          <h2 className="mt-5 max-w-3xl font-serif text-4xl sm:text-6xl">Objects with character. Stories with soul.</h2>
          <p className="mt-6 max-w-xl text-sm leading-7 text-sand/70">
            Join our circle for new releases, studio stories, and a closer look at Burundian craft.
          </p>
          <form className="mt-9 flex w-full max-w-lg border-b border-sand/60" onSubmit={(event) => { event.preventDefault(); setNotice("Welcome to the SHABA circle"); }}>
            <input
              aria-label="Email address"
              className="min-w-0 flex-1 bg-transparent py-4 text-sm text-sand outline-none placeholder:text-sand/50"
              placeholder="Your email address"
              type="email"
              required
            />
            <button className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Subscribe</button>
          </form>
        </div>
      </section>

      {notice && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 bg-forest px-6 py-4 text-xs font-medium text-sand shadow-2xl">
          {notice}
        </div>
      )}
    </main>
  );
}
