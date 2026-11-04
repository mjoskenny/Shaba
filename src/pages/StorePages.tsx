import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router";
import ProductCard from "../components/ProductCard";
import AnnouncementBar from "../components/AnnouncementBar";
import { normalizeProductSizes, products as fallbackProducts, type Product } from "../data";
import { useProducts } from "../hooks/useProducts";
import { createOrder, getProduct } from "../lib/api";
import { addCartItem, clearCart, getCart, getCartCount, removeCartItem, updateCartItem, type CartItem } from "../lib/cart";
import { SHABA_BRAND } from "../lib/brand";
import { trackStoreEvent } from "../lib/analytics";
import { getStoryContent } from "../lib/site-content";
import { applySeo, buildOrganizationSchema, getSeoConfigFromPath } from "../lib/seo";

const Arrow = ({ diagonal = false }: { diagonal?: boolean }) => (
  <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    {diagonal ? <path d="M7 17 17 7M8 7h9v9" /> : <path d="M5 12h14m-5-5 5 5-5 5" />}
  </svg>
);

const GridViewIcon = ({ columns }: { columns: 1 | 2 | 3 | 4 }) => (
  <span aria-hidden="true" className={`grid-view-icon grid-view-icon-${columns}`}>
    {Array.from({ length: columns * 2 }, (_, index) => <i key={index} />)}
  </span>
);

const NavIcon = ({ name }: { name: "bag" | "menu" | "close" }) => {
  const paths = {
    bag: (
      <>
        <path d="M5 8h14l-1 12H6L5 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    menu: <path d="M4 8h16M4 16h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return (
    <svg aria-hidden="true" className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      {paths[name]}
    </svg>
  );
};

const Wordmark = () => (
  <Link aria-label="SHABA home" className="brand-mark text-sand" to="/">
    <img
      alt="SHABA home"
      className="brand-logo-art"
      src="/shaba-wordmark-mask.png"
    />
  </Link>
);

export function SiteLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const isProductPage = location.pathname.startsWith("/products/");
  const [cartCount, setCartCount] = useState(getCartCount);
  const [addedItem, setAddedItem] = useState<CartItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    const seo = getSeoConfigFromPath(location.pathname);
    applySeo(seo);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    void trackStoreEvent("page_view", { path: location.pathname });
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (location.pathname.startsWith("/admin") || !(event.target instanceof Element)) return;
      const control = event.target.closest("a, button");
      if (!control || control.closest("[data-no-analytics]")) return;

      const rawHref = control instanceof HTMLAnchorElement ? control.getAttribute("href") : null;
      let href = "";
      if (rawHref) {
        try {
          const targetUrl = new URL(rawHref, window.location.origin);
          if (targetUrl.origin === window.location.origin) href = targetUrl.pathname.slice(0, 160);
        } catch {
          href = "";
        }
      }
      const label = control.getAttribute("aria-label") || control.textContent?.trim().replace(/\s+/g, " ") || "control";
      void trackStoreEvent("click", { target: href || label.slice(0, 120) });
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 48);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    const updateCount = (event: Event) => {
      setCartCount(getCartCount());
      const item = (event as CustomEvent<{ addedItem?: CartItem }>).detail?.addedItem;
      if (item) setAddedItem(item);
    };
    window.addEventListener("shaba-cart-change", updateCount);
    return () => window.removeEventListener("shaba-cart-change", updateCount);
  }, []);

  useEffect(() => {
    if (!addedItem) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAddedItem(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [addedItem]);

  return (
    <div className="min-h-screen bg-sand text-forest">
      <div className={isHomePage ? "fixed inset-x-0 top-0 z-40" : "sticky top-0 z-40"}>
        <AnnouncementBar />
        <header className={`relative transition-all duration-500 ${
          isHomePage
            ? scrolled
              ? "border-b border-sand/10 bg-forest/95 text-sand shadow-lg backdrop-blur-md"
              : "border-b border-transparent bg-transparent text-sand"
            : "border-b border-sand/10 bg-forest text-sand"
        }`}>
          <div className="relative mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:h-24 lg:px-14">
            <nav className="hidden items-center gap-8 text-[10px] font-semibold uppercase tracking-[0.16em] lg:flex">
              <Link className="nav-link" to="/shop">Shop</Link>
              <Link className="nav-link" to="/story">Our story</Link>
            </nav>
            <button aria-label={menuOpen ? "Close menu" : "Open menu"} className="icon-button lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              <NavIcon name={menuOpen ? "close" : "menu"} />
            </button>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Wordmark />
            </div>
            <div className="ml-auto flex items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.16em]">
              <Link aria-label={`Bag with ${cartCount} items`} className="flex items-center gap-2 transition-colors hover:text-gold" to="/cart">
                <NavIcon name="bag" />
                <span className="hidden sm:inline">Bag</span>
                <span>({cartCount})</span>
              </Link>
            </div>
          </div>
          {menuOpen && (
            <nav className="absolute inset-x-0 top-20 flex flex-col gap-6 border-t border-sand/15 bg-forest px-6 py-8 font-serif text-3xl shadow-xl lg:hidden">
                 {[["Shop", "/shop"], ["Our story", "/story"], ["Contact", "/contact"]].map(([label, to]) => (
                <Link key={label} onClick={() => setMenuOpen(false)} to={to}>{label}</Link>
              ))}
            </nav>
          )}
        </header>
      </div>
      {!isHomePage && !isProductPage && (
        <div className="mx-auto max-w-[1440px] px-5 pt-5 sm:px-8 lg:px-14">
          <button
            className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-forest/55 transition-colors hover:text-brass"
            onClick={() => {
              if (window.history.state?.idx > 0) navigate(-1);
              else navigate("/shop");
            }}
            type="button"
          >
            <svg aria-hidden="true" className="size-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
            Back
          </button>
        </div>
      )}
      <Outlet />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                name: SHABA_BRAND.name,
                url: SHABA_BRAND.website,
                description:
                  "SHABA creates contemporary leather goods and everyday essentials in Burundi with thoughtful design, honest materials, and lasting craftsmanship.",
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${SHABA_BRAND.website}/shop?q={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              },
              buildOrganizationSchema(),
            ],
          }),
        }}
        type="application/ld+json"
      />
      <footer className="site-footer bg-forest px-5 py-14 text-sand sm:px-8 lg:px-14">
        <div className="mx-auto grid max-w-[1440px] gap-12 border-b border-sand/15 pb-12 md:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-xs text-xs leading-6 text-sand/60">Rooted in Burundi. Made for what’s next.</p>
          </div>
          <FooterColumn title="Explore" links={[["Shop all", "/shop"], ["Sandals", "/shop"], ["Bags", "/shop"]]} />
          <FooterColumn title="About" links={[["Our story", "/story"], ["Contact", "/contact"], ["Returns & exchanges", "/refund-policy"]]} />
        </div>
        <div className="mx-auto mt-6 flex max-w-[1440px] justify-between text-[9px] uppercase tracking-[0.18em] text-sand/45">
          <span>© 2025 SHABA</span>
          <div className="flex items-center gap-5">
            <span className="hidden normal-case tracking-normal sm:inline">A random browser ID helps us understand store visits; contact details are not collected.</span>
            <Link to="/refund-policy">Returns & exchanges</Link>
          </div>
        </div>
      </footer>
      {addedItem && (
        <div className="cart-added-overlay" onClick={() => setAddedItem(null)}>
          <section
            aria-labelledby="cart-added-title"
            aria-modal="true"
            className="cart-added-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-forest/12 pb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-olive">Added to your bag</p>
              <button aria-label="Close bag confirmation" className="grid size-9 place-items-center text-2xl leading-none text-forest/60 transition-colors hover:text-forest" onClick={() => setAddedItem(null)} type="button">×</button>
            </div>
            <div className="flex gap-4 py-5">
              <img alt="" className="size-24 shrink-0 object-cover" src={addedItem.product.image} />
              <div className="min-w-0 pt-1">
                <h2 className="text-lg font-medium leading-tight tracking-[-0.035em]" id="cart-added-title">{addedItem.product.name}</h2>
                <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-forest/55">{addedItem.product.category} · Size {addedItem.size}</p>
                <p className="mt-3 text-sm font-semibold">{addedItem.product.price}</p>
              </div>
            </div>
            <p className="border-t border-forest/12 pt-4 text-xs text-forest/60">Your bag has {cartCount} {cartCount === 1 ? "piece" : "pieces"}.</p>
            <Link className="mt-5 flex min-h-12 items-center justify-between bg-forest px-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-sand transition-colors hover:bg-gold hover:text-forest" onClick={() => setAddedItem(null)} to="/cart">
              View bag <Arrow />
            </Link>
            <button className="mt-4 w-full py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-forest/65 transition-colors hover:text-forest" onClick={() => setAddedItem(null)} type="button">Continue shopping</button>
          </section>
        </div>
      )}
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{title}</p>
      <div className="mt-5 flex flex-col gap-3 text-xs text-sand/65">
        {links.map(([label, to]) => <Link className="transition-colors hover:text-sand" key={label} to={to}>{label}</Link>)}
      </div>
    </div>
  );
}

function PageIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <section className="shop-page-intro px-5 py-12 sm:px-8 sm:py-16 lg:px-14 lg:py-20">
      <div className="mx-auto grid max-w-[1440px] gap-5 md:grid-cols-[1.15fr_0.85fr] md:items-end md:gap-12">
        <div>
          <span className="home-section-label"><i>SHABA</i> / {eyebrow}</span>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-7xl">{title}</h1>
        </div>
        <p className="max-w-xl text-sm leading-7 text-forest/65 sm:text-base sm:leading-8">{copy}</p>
      </div>
    </section>
  );
}

export function ShopPage() {
  const { products, loading } = useProducts();
  const [audience, setAudience] = useState<"Women" | "Men">("Women");
  const [category, setCategory] = useState("New arrivals");
  const [productColumns, setProductColumns] = useState<2 | 3 | 4>(4);
  const [mobileColumns, setMobileColumns] = useState<1 | 2>(2);
  const audienceProducts = products.filter((product) => product.audience.includes(audience));
  const categories = ["New arrivals", ...Array.from(new Set(audienceProducts.map((product) => product.category)))];
  const visibleProducts = category === "New arrivals"
    ? audienceProducts
    : audienceProducts.filter((product) => product.category === category);
  const mobileGridClass = mobileColumns === 1 ? "grid-cols-1" : "grid-cols-2";
  const desktopGridClass = productColumns === 2
    ? "sm:grid-cols-2"
    : productColumns === 3
      ? "sm:grid-cols-3"
      : "sm:grid-cols-4";

  const selectAudience = (value: "Women" | "Men") => {
    setAudience(value);
    setCategory("New arrivals");
  };

  return (
    <main>
      <section className="px-5 pb-24 pt-14 sm:px-8 lg:px-14 lg:pb-32 lg:pt-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="product-section-heading mb-10 flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <span className="eyebrow text-brass">SHABA <span aria-hidden="true">/</span> The collection</span>
              <h2 className="mt-4 font-serif text-5xl text-forest sm:text-6xl">{audience} · {category}</h2>
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
              <div className="flex gap-2" aria-label="Filter by audience">
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
            </div>
          </div>

          <div className="collection-tabs mb-10 lg:mb-14">
            {categories.map((item) => (
              <button
                className={`collection-tab ${category === item ? "collection-tab-active" : ""}`}
                key={item}
                onClick={() => setCategory(item)}
              >
                <span>{item}</span>
                <small>{item === "New arrivals" ? audienceProducts.length : audienceProducts.filter((product) => product.category === item).length}</small>
              </button>
            ))}
          </div>
          {loading && <p className="mb-8 text-center text-xs uppercase tracking-[0.18em] text-forest/50">Refreshing collection</p>}
          <div className={`grid ${mobileGridClass} ${desktopGridClass} gap-x-5 gap-y-12`}>
            {visibleProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
          {!visibleProducts.length && (
            <div className="py-20 text-center">
              <h2 className="font-serif text-3xl">More pieces are coming.</h2>
              <p className="mt-4 text-sm text-forest/60">Try another category or collection.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(
    fallbackProducts.find((item) => item.slug === slug) ?? null,
  );
  const [activeImage, setActiveImage] = useState("");
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setSelectedSize("");
    setAdded(false);
    getProduct(slug).then((item) => {
      if (active) {
        setProduct(item);
        const sizes = normalizeProductSizes(item?.sizes);
        setSelectedSize(sizes.length === 1 ? sizes[0] : "");
        setActiveImage(item?.image ?? "");
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (product?.slug) void trackStoreEvent("product_view", { productSlug: product.slug });
  }, [product?.slug]);

  if (!product) return <NotFoundPage />;

  const galleryImages = [...new Set([product.image, ...(product.images ?? [])].filter(Boolean))];
  const availableSizes = normalizeProductSizes(product.sizes);
  const displayedImage = galleryImages.includes(activeImage) ? activeImage : product.image;

  return (
    <main>
      <section className="product-detail-page grid bg-sand lg:grid-cols-[1.05fr_0.95fr]">
        <div className="product-detail-gallery relative p-3 sm:p-5 lg:p-8">
          <Link className="product-back-link absolute left-6 top-6 z-10 inline-flex items-center gap-2 bg-sand/90 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-forest transition-colors hover:bg-forest hover:text-sand sm:left-8 sm:top-8" to="/shop">
            <svg aria-hidden="true" className="size-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
            Back to collection
          </Link>
          <img alt={product.name} className="product-detail-main-image aspect-[4/5] max-h-[78vh] w-full object-cover" src={displayedImage} />
          {galleryImages.length > 0 && <div aria-label={`${product.name} images`} className="product-thumbnails mt-3 flex gap-2 overflow-x-auto pb-1 sm:mt-4 sm:gap-3" role="group">
            {galleryImages.map((image, index) => (
              <button
                aria-label={`Show ${product.name} image ${index + 1}`}
                aria-pressed={displayedImage === image}
                className={`product-thumbnail size-[4.25rem] shrink-0 overflow-hidden sm:size-20 ${displayedImage === image ? "product-thumbnail-active" : ""}`}
                key={`${image}-${index}`}
                onClick={() => setActiveImage(image)}
                type="button"
              >
                <img alt="" className="size-full object-cover" loading="lazy" src={image} />
              </button>
            ))}
          </div>}
        </div>
        <div className="product-detail-copy-wrap flex items-start px-6 py-10 sm:px-12 sm:py-14 lg:sticky lg:top-24 lg:min-h-[calc(100vh-6rem)] lg:items-center lg:px-16 xl:px-24">
          <div className="product-detail-copy w-full max-w-lg">
            <span className="home-section-label text-brass">{product.category} <span aria-hidden="true">/</span> SHABA, BURUNDI</span>
            <h1 className="mt-4 max-w-xl text-5xl font-medium leading-[0.96] tracking-[-0.06em] sm:text-6xl lg:text-7xl">{product.name}</h1>
            <p className="product-detail-price mt-5 text-lg font-medium tracking-[-0.02em]">{product.price}</p>
            <p className="mt-6 max-w-md text-sm leading-7 text-forest/65">{product.description}</p>
            <div className="product-size-picker mt-7 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">Choose size</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    aria-pressed={selectedSize === size}
                    className={`min-w-11 rounded-full border px-4 py-3 text-xs transition-colors ${selectedSize === size ? "border-forest bg-forest text-sand" : "border-forest/25 hover:bg-forest hover:text-sand"}`}
                    key={size}
                    onClick={() => { setSelectedSize(size); setAdded(false); }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <button className="mt-6 flex min-h-14 w-full max-w-md items-center justify-between bg-forest px-6 text-xs font-semibold uppercase tracking-[0.16em] text-sand transition-colors hover:bg-gold hover:text-forest disabled:cursor-not-allowed disabled:opacity-45" disabled={!selectedSize} onClick={() => { addCartItem(product, selectedSize); void trackStoreEvent("add_to_cart", { productSlug: product.slug }); setAdded(true); }}>
              <span>{added ? "Added to your bag" : selectedSize ? "Add to bag" : "Select a size"}</span>
              <Arrow />
            </button>
            <div className="product-detail-meta mt-8 grid max-w-md grid-cols-2 gap-5 pt-5 text-[10px] leading-5 text-forest/60">
              <p><strong className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-forest/80">Collection</strong>{product.category}</p>
              <p><strong className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-forest/80">Made in</strong>Bujumbura, Burundi</p>
            </div>
          </div>
        </div>
      </section>
      <section className="product-note-banner px-5 py-16 text-sand sm:px-8 lg:px-14 lg:py-20">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-2">
          <h2 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Made here. Made to become yours.</h2>
          <p className="max-w-xl text-sm leading-7 text-sand/75">Every SHABA piece is made in Burundi with care, character, and the intention to be part of your everyday.</p>
        </div>
      </section>
    </main>
  );
}

export function StoryPage() {
  const story = getStoryContent();

  return (
    <main>
      <PageIntro eyebrow={story.eyebrow} title={story.title} copy={story.intro} />
      <section className="grid lg:grid-cols-2">
        <img alt="Green hills overlooking a lake in Burundi" className="min-h-[520px] size-full object-cover lg:min-h-[760px]" src={story.image} />
        <div className="flex items-center px-7 py-20 sm:px-14 lg:px-20">
          <div className="max-w-xl">
            <span className="eyebrow text-brass">Designed from home</span>
            <h2 className="mt-6 font-serif text-5xl leading-tight">{story.secondaryTitle}</h2>
            <p className="mt-7 text-sm leading-8 text-forest/65">{story.secondaryCopy}</p>
            <p className="mt-5 text-sm leading-8 text-forest/65">{story.secondaryCopyTwo}</p>
          </div>
        </div>
      </section>
      <section className="story-values px-5 py-16 text-sand sm:px-8 lg:px-14 lg:py-24">
        <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <span className="eyebrow text-gold">What guides us</span>
          <div>
            <h2 className="font-serif text-5xl leading-tight sm:text-6xl">{story.valuesTitle}</h2>
            <div className="mt-12 grid gap-8 border-t border-sand/20 pt-8 sm:grid-cols-3">
              {["01", "02", "03"].map((number) => (
                <div key={number}><span className="text-xs text-gold">{number}</span><p className="mt-4 font-serif text-2xl">{number === "01" ? "Dignified work" : number === "02" ? "Material honesty" : "Lasting relevance"}</p></div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="story-future px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
        <div className="mx-auto grid max-w-[1440px] items-center gap-14 lg:grid-cols-2">
          <div><span className="eyebrow text-brass">Looking forward</span><h2 className="mt-5 font-serif text-5xl">{story.futureTitle}</h2></div>
          <p className="text-sm leading-8 text-forest/65">{story.futureCopy}</p>
        </div>
      </section>
    </main>
  );
}

export function ContactPage() {
  return (
    <main>
      <PageIntro eyebrow="Contact" title="Let’s continue the conversation." copy="Questions about handmade fashion from Burundi, an order, care, or a possible collaboration? Reach the Shaba Crafts team in Bujumbura." />
      <section className="px-5 py-20 sm:px-8 lg:px-14 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="eyebrow text-brass">Find us</span>
            <div className="mt-8 space-y-7 text-sm leading-7">
              <div><strong className="block font-serif text-2xl">Bujumbura</strong><span className="text-forest/55">Burundi · Visits by appointment</span></div>
              <div><strong className="block">WhatsApp</strong><a className="text-forest/60 hover:text-forest" href={SHABA_BRAND.whatsappHref} rel="noreferrer" target="_blank">{SHABA_BRAND.contactNumber}</a></div>
              <div><strong className="block">Email</strong><a className="text-forest/60 hover:text-forest" href={`mailto:${SHABA_BRAND.email}`}>{SHABA_BRAND.email}</a></div>
            </div>
          </div>
          <form className="contact-form p-7 text-sand sm:p-10" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const message = `Hello SHABA,\n\nName: ${form.get("name")}\nEmail: ${form.get("email")}\nSubject: ${form.get("subject")}\n\n${form.get("message")}`;
            window.open(`${SHABA_BRAND.whatsappHref}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
          }}>
            <h2 className="font-serif text-4xl">Send a note</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <ContactField label="Name" name="name" type="text" />
              <ContactField label="Email" name="email" type="email" />
            </div>
            <ContactField label="Subject" name="subject" type="text" />
            <label className="mt-6 block text-[10px] font-semibold uppercase tracking-[0.16em]">Message<textarea className="mt-2 min-h-40 w-full rounded-xl border border-sand/20 bg-transparent p-4 text-sm normal-case tracking-normal outline-none focus:border-gold" name="message" required /></label>
            <button className="mt-7 inline-flex rounded-full bg-gold px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-forest">Continue on WhatsApp</button>
          </form>
        </div>
      </section>
    </main>
  );
}

function ContactField({ label, name, type }: { label: string; name: string; type: string }) {
  return <label className="mt-6 block text-[10px] font-semibold uppercase tracking-[0.16em]">{label}<input className="mt-2 w-full border-b border-sand/25 bg-transparent py-3 text-sm normal-case tracking-normal outline-none focus:border-gold" name={name} required type={type} /></label>;
}

export function RefundPolicyPage() {
  const sections = [
    ["Returns", "If you’re not satisfied with your purchase, you can return or exchange it within 24 hours of receiving it."],
    ["Eligibility", "The item must be unused, unworn, and in its original condition, with all tags and packaging intact. Returns must be requested within 24 hours of delivery or pickup. Proof of purchase, such as a receipt or order confirmation, is required."],
    ["Process", `Contact us at ${SHABA_BRAND.email} or ${SHABA_BRAND.contactNumber}. Let us know whether the issue concerns fit, size, or the condition of the product. Arrange for the item to be returned to our shop; return or transport costs are covered by the customer. Once we receive and inspect the product, you can choose between an exchange or a refund.`],
    ["Exclusions", "Items showing signs of wear or damage caused after delivery cannot be returned. Custom or personalised items may not be eligible for return unless defective."],
  ];
  return (
    <main>
      <PageIntro eyebrow="Customer care" title="Return & Exchange Policy" copy="At SHABA, we take pride in the care and craftsmanship behind every product we make. Each piece is made by hand and carefully checked before it reaches you. But if your order doesn’t fit as expected or arrives in less-than-perfect condition, we’ll be glad to help you return or exchange it." />
      <section className="px-5 py-20 sm:px-8 lg:px-14 lg:py-28">
        <div className="mx-auto max-w-4xl divide-y divide-forest/15">
          {sections.map(([title, copy], index) => (
            <div className="grid gap-6 py-10 sm:grid-cols-[80px_1fr_2fr]" key={title}>
              <span className="text-xs text-gold">0{index + 1}</span>
              <h2 className="font-serif text-3xl">{title}</h2>
              <p className="text-sm leading-8 text-forest/65">{copy}</p>
            </div>
          ))}
          <div className="pt-10">
            <a className="button" href={SHABA_BRAND.whatsappHref} rel="noreferrer" target="_blank">Request a return <Arrow /></a>
          </div>
        </div>
      </section>
    </main>
  );
}

export function CartPage() {
  const [items, setItems] = useState<CartItem[]>(getCart);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [orderSaveWarning, setOrderSaveWarning] = useState("");
  const [savedOrderId, setSavedOrderId] = useState("");
  const [checkout, setCheckout] = useState({ name: "", phone: "", fulfillment: "Pickup in Bujumbura", area: "", note: "" });
  const totalValue = items.reduce((sum, item) => sum + Number(item.product.price.replace(/\D/g, "")) * item.quantity, 0);
  const total = `${new Intl.NumberFormat("en-US").format(totalValue)} BIF`;

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    void trackStoreEvent("checkout_start");
    setCheckoutError("");
    setOrderSaveWarning("");
    setSubmitting(true);
    const whatsappWindow = window.open("about:blank", "_blank");
    const productLines = items.map((item) => [
      `• ${item.product.name} · Size ${item.size} × ${item.quantity} — ${item.product.price}`,
      `  ${item.product.image}`,
    ].join("\n")).join("\n");
    let orderId = "";
    let saveError = "";
    const orderRequest = new AbortController();
    const orderTimeout = window.setTimeout(() => orderRequest.abort(), 12000);
    try {
      const order = await createOrder(items.map((item) => ({
        slug: item.product.slug,
        name: item.product.name,
        quantity: item.quantity,
        size: item.size,
        price: item.product.price,
        image: item.product.image,
      })), total, checkout, orderRequest.signal);
      orderId = order.id;
    } catch (error) {
      saveError = error instanceof Error ? error.message : "Unable to save order";
    } finally {
      window.clearTimeout(orderTimeout);
    }

    const message = [
      "Hello SHABA, I would like to place this order:",
      orderId ? `Order reference: ${orderId}` : "Order reference: WhatsApp checkout",
      "",
      productLines,
      "",
      `Total: ${total}`,
      `Name: ${checkout.name}`,
      `Phone: ${checkout.phone}`,
      `Fulfillment: ${checkout.fulfillment}`,
      checkout.area ? `Delivery area: ${checkout.area}` : "",
      checkout.note ? `Note: ${checkout.note}` : "",
    ].filter(Boolean).join("\n");
    const whatsappUrl = `${SHABA_BRAND.whatsappHref}?text=${encodeURIComponent(message)}`;

    try {
      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl;
      } else {
        window.location.href = whatsappUrl;
      }
      if (orderId) {
        clearCart();
        setItems([]);
        setSavedOrderId(orderId);
      } else {
        setOrderSaveWarning(`We opened WhatsApp, but could not save this order to the dashboard (${saveError}). Please send the WhatsApp message to complete your request.`);
      }
      setSubmitted(true);
    } catch {
      whatsappWindow?.close();
      setCheckoutError("We couldn't open WhatsApp. Please check that WhatsApp is available and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center px-5 py-20 text-center">
        <div className="max-w-xl">
          <span className="eyebrow text-gold">WhatsApp checkout</span>
          <h1 className="mt-5 font-serif text-5xl">One last step.</h1>
          <p className="mt-6 text-sm leading-7 text-forest/60">Your order details are ready in WhatsApp. Review the message and tap Send to place your order with SHABA.</p>
          {savedOrderId && <p className="mt-4 text-xs text-forest/55">Order reference: {savedOrderId}</p>}
          {orderSaveWarning && <p className="mt-5 border border-brass/30 bg-brass/10 p-4 text-left text-xs leading-6 text-brass">{orderSaveWarning}</p>}
          <Link className="underlined-link mt-8" to="/shop">Continue exploring <Arrow /></Link>
        </div>
      </main>
    );
  }

  if (items.length) {
    return (
      <main className="px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <span className="eyebrow text-brass">Your bag</span>
          <h1 className="mt-4 font-serif text-5xl">Selected pieces.</h1>
          <div className="mt-10 divide-y divide-forest/15 border-y border-forest/15">
            {items.map((item) => (
              <div className="grid grid-cols-[88px_1fr_auto] items-center gap-5 py-5" key={`${item.product.slug}-${item.size}`}>
                <img alt="" className="aspect-square size-full object-cover" src={item.product.image} />
                <div>
                  <h2 className="font-serif text-xl">{item.product.name}</h2>
                  <p className="mt-1 text-xs text-forest/55">Size {item.size}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button aria-label={`Decrease ${item.product.name} quantity`} className="grid size-7 place-items-center rounded-full border border-forest/20" onClick={() => { updateCartItem(item.product.slug, item.size, item.quantity - 1); setItems(getCart()); }}>−</button>
                    <span className="text-xs">{item.quantity}</span>
                    <button aria-label={`Increase ${item.product.name} quantity`} className="grid size-7 place-items-center rounded-full border border-forest/20" onClick={() => { updateCartItem(item.product.slug, item.size, item.quantity + 1); setItems(getCart()); }}>+</button>
                    <button className="ml-2 text-[10px] uppercase tracking-[0.12em] text-brass underline underline-offset-4" onClick={() => { removeCartItem(item.product.slug, item.size); setItems(getCart()); }}>Remove</button>
                  </div>
                </div>
                <strong className="text-sm">{item.product.price}</strong>
              </div>
            ))}
          </div>
          <form className="ml-auto mt-8 max-w-xl" onSubmit={submitOrder}>
            <div className="flex justify-between border-b border-forest/15 pb-5"><span>Total</span><strong>{total}</strong></div>
            <h2 className="mt-8 font-serif text-3xl">Checkout details</h2>
            <p className="mt-2 text-xs leading-5 text-forest/50">Your name, phone, fulfillment, and order details are saved to the order dashboard and included in the WhatsApp message.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <CheckoutField label="Name" value={checkout.name} onChange={(name) => setCheckout({ ...checkout, name })} />
              <CheckoutField label="Phone" type="tel" value={checkout.phone} onChange={(phone) => setCheckout({ ...checkout, phone })} />
            </div>
            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.14em]">Fulfillment
              <select className="mt-2 w-full rounded-xl border border-forest/15 bg-transparent p-4 text-sm" onChange={(event) => setCheckout({ ...checkout, fulfillment: event.target.value })} value={checkout.fulfillment}>
                <option>Pickup in Bujumbura</option><option>Delivery</option>
              </select>
            </label>
            {checkout.fulfillment === "Delivery" && <CheckoutField label="Delivery area" value={checkout.area} onChange={(area) => setCheckout({ ...checkout, area })} />}
            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.14em]">Order note
              <textarea className="mt-2 min-h-24 w-full rounded-xl border border-forest/15 bg-transparent p-4 text-sm normal-case tracking-normal" onChange={(event) => setCheckout({ ...checkout, note: event.target.value })} value={checkout.note} />
            </label>
            <button className="mt-6 flex w-full items-center justify-between rounded-full bg-forest px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-sand hover:bg-gold hover:text-forest" disabled={submitting}>
              {submitting ? "Preparing WhatsApp…" : "Checkout on WhatsApp"} <Arrow />
            </button>
            {checkoutError && <p className="mt-4 text-center text-xs leading-5 text-brass">{checkoutError}</p>}
            <p className="mt-4 text-center text-[10px] leading-5 text-forest/45">The WhatsApp message includes product details and public image links. Websites cannot automatically attach image files to WhatsApp messages.</p>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[65vh] items-center justify-center px-5 py-20 text-center">
      <div className="max-w-xl">
        <span className="eyebrow text-brass">Your bag</span>
        <h1 className="mt-5 font-serif text-5xl">Your bag is waiting.</h1>
        <p className="mt-6 text-sm leading-7 text-forest/60">You have not added any pieces yet. Explore the collection and find something made to travel with you.</p>
        <Link className="button mt-9" to="/shop">Explore the collection <Arrow /></Link>
      </div>
    </main>
  );
}

function CheckoutField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.14em]">{label}<input className="mt-2 w-full rounded-xl border border-forest/15 bg-transparent p-4 text-sm normal-case tracking-normal" onChange={(event) => onChange(event.target.value)} required type={type} value={value} /></label>;
}

export function NotFoundPage() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center px-5 py-20 text-center">
      <div>
        <span className="eyebrow text-brass">404</span>
        <h1 className="mt-5 font-serif text-5xl">This path ends here.</h1>
        <Link className="underlined-link mt-8" to="/">Return home <Arrow /></Link>
      </div>
    </main>
  );
}
