import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router";
import ProductCard from "../components/ProductCard";
import AnnouncementBar from "../components/AnnouncementBar";
import { craftImages, products as fallbackProducts, type Product } from "../data";
import { useProducts } from "../hooks/useProducts";
import { createOrder, getJournal, getJournals, getProduct } from "../lib/api";
import { addCartItem, clearCart, getCart, getCartCount, removeCartItem, updateCartItem, type CartItem } from "../lib/cart";
import { fallbackJournals, type JournalEntry } from "../journals";

const Arrow = ({ diagonal = false }: { diagonal?: boolean }) => (
  <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    {diagonal ? <path d="M7 17 17 7M8 7h9v9" /> : <path d="M5 12h14m-5-5 5 5-5 5" />}
  </svg>
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
    <span aria-hidden="true" className="brand-logo-art" />
  </Link>
);

export function SiteLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [cartCount, setCartCount] = useState(getCartCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 48);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    const updateCount = () => setCartCount(getCartCount());
    window.addEventListener("shaba-cart-change", updateCount);
    return () => window.removeEventListener("shaba-cart-change", updateCount);
  }, []);

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
              <Link className="nav-link" to="/craft">Craft</Link>
            </nav>
            <button aria-label={menuOpen ? "Close menu" : "Open menu"} className="icon-button lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              <NavIcon name={menuOpen ? "close" : "menu"} />
            </button>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Wordmark />
            </div>
            <div className="ml-auto flex items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.16em]">
              <Link className="nav-link hidden sm:block" to="/journal">Journal</Link>
              <Link aria-label={`Bag with ${cartCount} items`} className="flex items-center gap-2 transition-colors hover:text-gold" to="/cart">
                <NavIcon name="bag" />
                <span className="hidden sm:inline">Bag</span>
                <span>({cartCount})</span>
              </Link>
            </div>
          </div>
          {menuOpen && (
            <nav className="absolute inset-x-0 top-20 flex flex-col gap-6 border-t border-sand/15 bg-forest px-6 py-8 font-serif text-3xl shadow-xl lg:hidden">
              {[["Shop", "/shop"], ["Our story", "/story"], ["Craft", "/craft"], ["Journal", "/journal"], ["Contact", "/contact"]].map(([label, to]) => (
                <Link key={label} onClick={() => setMenuOpen(false)} to={to}>{label}</Link>
              ))}
            </nav>
          )}
        </header>
      </div>
      <Outlet />
      <footer className="bg-olive px-5 py-14 text-sand sm:px-8 lg:px-14">
        <div className="mx-auto grid max-w-[1440px] gap-12 border-b border-sand/15 pb-12 md:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-xs text-xs leading-6 text-sand/60">Rooted in Burundi. Made for what’s next.</p>
          </div>
          <FooterColumn title="Explore" links={[["Shop all", "/shop"], ["Sandals", "/shop"], ["Bags", "/shop"]]} />
          <FooterColumn title="About" links={[["Our story", "/story"], ["Our craft", "/craft"], ["Journal", "/journal"]]} />
          <FooterColumn title="Support" links={[["Care guide", "/care"], ["Returns & exchanges", "/refund-policy"], ["Contact", "/contact"]]} />
        </div>
        <div className="mx-auto mt-6 flex max-w-[1440px] justify-between text-[9px] uppercase tracking-[0.18em] text-sand/45">
          <span>© 2025 SHABA</span>
          <Link to="/refund-policy">Returns & exchanges</Link>
        </div>
      </footer>
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
    <section className="bg-forest px-5 py-20 text-sand sm:px-8 sm:py-24 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <span className="eyebrow text-gold">{eyebrow}</span>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[1.02] sm:text-7xl">{title}</h1>
        <p className="mt-7 max-w-2xl text-sm leading-7 text-sand/70 sm:text-base">{copy}</p>
      </div>
    </section>
  );
}

export function ShopPage() {
  const { products, loading } = useProducts();
  const [audience, setAudience] = useState<"Women" | "Men">("Women");
  const [category, setCategory] = useState("New arrivals");
  const audienceProducts = products.filter((product) => product.audience.includes(audience));
  const categories = ["New arrivals", ...Array.from(new Set(audienceProducts.map((product) => product.category)))];
  const visibleProducts = category === "New arrivals"
    ? audienceProducts
    : audienceProducts.filter((product) => product.category === category);

  const selectAudience = (value: "Women" | "Men") => {
    setAudience(value);
    setCategory("New arrivals");
  };

  return (
    <main>
      <PageIntro eyebrow="The collection" title="Objects made to travel through life." copy="Functional leather pieces designed in Bujumbura, cut with intention, and finished by skilled hands." />
      <section className="px-5 pb-24 pt-10 sm:px-8 lg:px-14 lg:pb-32 lg:pt-14">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 flex justify-center gap-2">
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
          <div className="collection-tabs mb-12">
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
          <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
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
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    if (!slug) return;
    let active = true;
    getProduct(slug).then((item) => {
      if (active) {
        setProduct(item);
        if (item?.sizes?.length === 1) setSelectedSize(item.sizes[0]);
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  if (!product) return <NotFoundPage />;

  return (
    <main>
      <section className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-2 bg-[#e4ded2] p-2 sm:grid-cols-2">
          <img alt={product.name} className="aspect-[4/5] size-full object-cover sm:col-span-2" src={product.image} />
          <img alt="Hand tools used to finish SHABA leather goods" className="aspect-square size-full object-cover" src={craftImages.detail} />
          <img alt="Leather craft bench in the SHABA workshop" className="aspect-square size-full object-cover" src={craftImages.bench} />
        </div>
        <div className="flex items-start px-6 py-14 sm:px-12 lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:items-center lg:px-16">
          <div className="w-full max-w-xl">
            <Link className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brass" to="/shop">Collection / {product.category}</Link>
            <h1 className="mt-5 font-serif text-5xl leading-none sm:text-6xl">{product.name}</h1>
            <p className="mt-5 text-lg font-semibold">{product.price}</p>
            <p className="mt-8 text-sm leading-7 text-forest/65">{product.description}</p>
            <div className="mt-9 border-y border-forest/15 py-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">Choose size</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(product.sizes?.length ? product.sizes : ["One size"]).map((size) => (
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
            <button className="mt-8 flex min-h-14 w-full items-center justify-between rounded-full bg-forest px-7 text-xs font-semibold uppercase tracking-[0.16em] text-sand transition-colors hover:bg-gold hover:text-forest disabled:cursor-not-allowed disabled:opacity-45" disabled={!selectedSize} onClick={() => { addCartItem(product, selectedSize); setAdded(true); }}>
              <span>{added ? "Added to your bag" : selectedSize ? "Add to bag" : "Select a size"}</span>
              <Arrow />
            </button>
            <div className="mt-8 grid grid-cols-2 gap-5 text-xs leading-5 text-forest/60">
              <p><strong className="block text-forest">Materials</strong>Full-grain leather and raw brass</p>
              <p><strong className="block text-forest">Made in</strong>Bujumbura, Burundi</p>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-olive px-5 py-20 text-sand sm:px-8 lg:px-14">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-2">
          <h2 className="font-serif text-5xl">Made to become yours.</h2>
          <p className="max-w-xl text-sm leading-7 text-sand/70">Natural variations are part of the material’s character. With use, your piece will soften, deepen in tone, and record the journeys you take together.</p>
        </div>
      </section>
    </main>
  );
}

export function StoryPage() {
  return (
    <main>
      <PageIntro eyebrow="Our roots" title="Burundian roots. Timeless perspective." copy="SHABA began with a simple belief: the objects we carry can hold the identity, skill, and ambition of the place where they are made." />
      <section className="grid lg:grid-cols-2">
        <img alt="Green hills overlooking a lake in Burundi" className="min-h-[520px] size-full object-cover lg:min-h-[760px]" src="https://images.unsplash.com/photo-1591216491474-a22d5296fe98?auto=format&fit=crop&w=1400&q=90" />
        <div className="flex items-center px-7 py-20 sm:px-14 lg:px-20">
          <div className="max-w-xl">
            <span className="eyebrow text-brass">Designed from home</span>
            <h2 className="mt-6 font-serif text-5xl leading-tight">A modern expression of local craft.</h2>
            <p className="mt-7 text-sm leading-8 text-forest/65">Every collection begins in Bujumbura. We draw from the clarity of the landscape, the rhythm of city life, and a long tradition of making useful things well.</p>
            <p className="mt-5 text-sm leading-8 text-forest/65">Our goal is not nostalgia. It is to carry Burundian craft forward through thoughtful design, lasting materials, and meaningful work.</p>
          </div>
        </div>
      </section>
      <section className="bg-olive px-5 py-20 text-sand sm:px-8 lg:px-14 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <span className="eyebrow text-gold">What guides us</span>
          <div>
            <h2 className="font-serif text-5xl leading-tight sm:text-6xl">Build locally. Design openly. Make things worth keeping.</h2>
            <div className="mt-12 grid gap-8 border-t border-sand/20 pt-8 sm:grid-cols-3">
              {[["01", "Dignified work"], ["02", "Material honesty"], ["03", "Lasting relevance"]].map(([number, value]) => (
                <div key={number}><span className="text-xs text-gold">{number}</span><p className="mt-4 font-serif text-2xl">{value}</p></div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="px-5 py-20 sm:px-8 lg:px-14 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] items-center gap-14 lg:grid-cols-2">
          <div><span className="eyebrow text-brass">Looking forward</span><h2 className="mt-5 font-serif text-5xl">A Burundian house with a global horizon.</h2></div>
          <p className="text-sm leading-8 text-forest/65">We are building SHABA slowly and deliberately: expanding skills, creating meaningful local opportunities, and showing that contemporary African design can be both deeply rooted and confidently international. Every object is part of that longer story.</p>
        </div>
      </section>
    </main>
  );
}

export function CraftPage() {
  const steps = [
    ["01", "Selection", "Full-grain hides are chosen for strength, feel, and the way they will age."],
    ["02", "Cutting", "Every panel is measured and cut to preserve the best character of the leather."],
    ["03", "Assembly", "Edges are finished, hardware is set, and each seam is stitched with precision."],
    ["04", "Finishing", "The completed piece is conditioned, inspected, and prepared for its next journey."],
  ];
  return (
    <main>
      <PageIntro eyebrow="Our craft" title="Patient hands. Honest materials." copy="Our process is deliberate because durability is built one careful decision at a time." />
      <img alt="Leatherworking tools on an artisan’s bench" className="h-[55vh] min-h-[460px] w-full object-cover" src={craftImages.tools} />
      <section className="px-5 py-20 sm:px-8 lg:px-14 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-px overflow-hidden bg-forest/15 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([number, title, copy]) => (
            <article className="bg-sand p-8 lg:p-10" key={number}>
              <span className="text-[10px] font-semibold tracking-[0.18em] text-gold">{number}</span>
              <h2 className="mt-12 font-serif text-3xl">{title}</h2>
              <p className="mt-5 text-sm leading-7 text-forest/60">{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="grid bg-forest text-sand lg:grid-cols-2">
        <img alt="Close-up of leatherworking tools and thread" className="min-h-[520px] size-full object-cover" src={craftImages.detail} />
        <div className="flex items-center px-7 py-20 sm:px-14 lg:px-20">
          <div><span className="eyebrow text-gold">Material standard</span><h2 className="mt-6 font-serif text-5xl">Chosen for the years ahead.</h2><p className="mt-7 text-sm leading-8 text-sand/65">We favor full-grain leather, solid hardware, and repairable construction. These materials cost more and ask more of the maker, but they reward the owner with strength, character, and a longer useful life.</p><Link className="underlined-link mt-8" to="/care">Learn how to care for leather <Arrow /></Link></div>
        </div>
      </section>
    </main>
  );
}

export function JournalPage() {
  const [stories, setStories] = useState<JournalEntry[]>(fallbackJournals);
  useEffect(() => {
    getJournals().then(setStories);
  }, []);
  return (
    <main>
      <PageIntro eyebrow="Journal" title="Notes on objects, origins, and making." copy="Stories from the studio and a closer look at the people, materials, and ideas behind SHABA." />
      <section className="px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-3">
          {stories.map((story) => (
            <article key={story.slug}>
              <Link to={`/journal/${story.slug}`}><img alt="" className="aspect-[4/5] w-full object-cover" src={story.image} /></Link>
              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-brass">{story.category}</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight">{story.title}</h2>
              <p className="mt-4 text-sm leading-7 text-forest/55">{story.excerpt}</p>
              <Link className="underlined-link mt-6" to={`/journal/${story.slug}`}>Read story <Arrow /></Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function JournalDetailPage() {
  const { slug } = useParams();
  const [story, setStory] = useState<JournalEntry | null>(fallbackJournals.find((item) => item.slug === slug) ?? null);
  useEffect(() => {
    if (slug) getJournal(slug).then(setStory);
  }, [slug]);
  if (!story) return <NotFoundPage />;
  return (
    <main>
      <section className="bg-forest px-5 py-20 text-sand sm:px-8 lg:px-14 lg:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <span className="eyebrow text-gold">{story.category}</span>
          <h1 className="mt-6 font-serif text-5xl leading-tight sm:text-7xl">{story.title}</h1>
          <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-sand/65">{story.excerpt}</p>
        </div>
      </section>
      <img alt="" className="h-[60vh] min-h-[480px] w-full object-cover" src={story.image} />
      <article className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        {story.body.map((paragraph, index) => <p className={`text-base leading-8 text-forest/70 ${index ? "mt-7" : "first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-7xl first-letter:leading-[0.8]"}`} key={index}>{paragraph}</p>)}
        <div className="mt-14 border-t border-forest/15 pt-8"><Link className="underlined-link" to="/journal">Back to journal <Arrow /></Link></div>
      </article>
    </main>
  );
}

export function CarePage() {
  const guidance = [
    ["Clean gently", "Wipe away dust with a soft, dry cloth. For marks, use a barely damp cloth and let the leather dry naturally."],
    ["Condition sparingly", "Apply a neutral leather conditioner every few months, testing first on an inconspicuous area."],
    ["Store thoughtfully", "Keep away from prolonged sun, heat, and humidity. Fill bags lightly to help retain their shape."],
    ["Let it age", "Small variations, softening, and a deepening patina are signs of genuine leather becoming uniquely yours."],
  ];
  return (
    <main>
      <PageIntro eyebrow="Care guide" title="Keep it well. Carry it longer." copy="A little regular care protects the leather while allowing its natural character to develop." />
      <section className="px-5 py-20 sm:px-8 lg:px-14 lg:py-28">
        <div className="mx-auto max-w-4xl divide-y divide-forest/15">
          {guidance.map(([title, copy], index) => (
            <div className="grid gap-5 py-9 sm:grid-cols-[80px_1fr_2fr]" key={title}>
              <span className="text-xs text-gold">0{index + 1}</span>
              <h2 className="font-serif text-2xl">{title}</h2>
              <p className="text-sm leading-7 text-forest/60">{copy}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-olive px-5 py-20 text-sand sm:px-8 lg:px-14">
        <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-2">
          <div><span className="eyebrow text-gold">Common questions</span><h2 className="mt-5 font-serif text-5xl">Care without complication.</h2></div>
          <div className="divide-y divide-sand/20">
            {[
              ["What if my piece gets wet?", "Blot gently, reshape if needed, and let it dry naturally away from direct heat."],
              ["Can scratches be removed?", "Many light marks blend into the patina. A small amount of conditioner can soften their appearance."],
              ["How often should I condition it?", "Usually every three to six months, depending on climate and use. The leather should feel supple, never greasy."],
              ["Do you offer repairs?", "Contact us with photographs and a short description. We will advise on the best next step."],
            ].map(([question, answer]) => <div className="py-6" key={question}><h3 className="font-serif text-2xl">{question}</h3><p className="mt-3 text-sm leading-7 text-sand/65">{answer}</p></div>)}
          </div>
        </div>
      </section>
    </main>
  );
}

export function ContactPage() {
  return (
    <main>
      <PageIntro eyebrow="Contact" title="Let’s continue the conversation." copy="Questions about a product, an order, care, or a possible collaboration? Reach the SHABA team in Bujumbura." />
      <section className="px-5 py-20 sm:px-8 lg:px-14 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="eyebrow text-brass">Find us</span>
            <div className="mt-8 space-y-7 text-sm leading-7">
              <div><strong className="block font-serif text-2xl">Bujumbura</strong><span className="text-forest/55">Burundi · Visits by appointment</span></div>
              <div><strong className="block">WhatsApp</strong><a className="text-forest/60 hover:text-forest" href="https://wa.me/250795979106" rel="noreferrer" target="_blank">+250 795 979 106</a></div>
              <div><strong className="block">Email</strong><a className="text-forest/60 hover:text-forest" href="mailto:hello@shabaleather.com">hello@shabaleather.com</a></div>
            </div>
          </div>
          <form className="rounded-3xl bg-forest p-7 text-sand sm:p-12" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const message = `Hello SHABA,\n\nName: ${form.get("name")}\nEmail: ${form.get("email")}\nSubject: ${form.get("subject")}\n\n${form.get("message")}`;
            window.open(`https://wa.me/250795979106?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
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
    ["Process", "Contact us at hello@shabaleather.com or +250 795 979 106. Let us know whether the issue concerns fit, size, or the condition of the product. Arrange for the item to be returned to our shop; return or transport costs are covered by the customer. Once we receive and inspect the product, you can choose between an exchange or a refund."],
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
            <a className="button" href="https://wa.me/250795979106" rel="noreferrer" target="_blank">Request a return <Arrow /></a>
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
  const [checkout, setCheckout] = useState({ name: "", phone: "", fulfillment: "Pickup in Bujumbura", area: "", note: "" });
  const totalValue = items.reduce((sum, item) => sum + Number(item.product.price.replace(/\D/g, "")) * item.quantity, 0);
  const total = `${new Intl.NumberFormat("en-US").format(totalValue)} BIF`;

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const whatsappWindow = window.open("about:blank", "_blank");
    const productLines = items.map((item) => [
      `• ${item.product.name} · Size ${item.size} × ${item.quantity} — ${item.product.price}`,
      `  ${item.product.image}`,
    ].join("\n")).join("\n");
    const message = [
      "Hello SHABA, I would like to place this order:",
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
    try {
      await createOrder(items.map((item) => ({ slug: item.product.slug, name: item.product.name, quantity: item.quantity, size: item.size })), total);
      if (whatsappWindow) whatsappWindow.location.href = `https://wa.me/250795979106?text=${encodeURIComponent(message)}`;
      else window.location.href = `https://wa.me/250795979106?text=${encodeURIComponent(message)}`;
      clearCart();
      setItems([]);
      setSubmitted(true);
    } catch {
      whatsappWindow?.close();
      setCheckoutError("We could not save your order. Please try again before continuing to WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center px-5 py-20 text-center">
        <div className="max-w-xl">
          <span className="eyebrow text-gold">Order received</span>
          <h1 className="mt-5 font-serif text-5xl">Thank you.</h1>
          <p className="mt-6 text-sm leading-7 text-forest/60">Your order is now in the SHABA studio queue. We will confirm the next steps with you directly.</p>
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
            <p className="mt-2 text-xs leading-5 text-forest/50">These details are sent to WhatsApp and are not stored in Supabase.</p>
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
