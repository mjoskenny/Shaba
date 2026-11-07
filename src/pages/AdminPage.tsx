import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import BrandLogo from "../components/BrandLogo";
import { normalizeProductSizes, type Product } from "../data";
import { adminApi, type OrderRecord, type StoreInsights } from "../lib/api";
import { createSiteMediaEntry, defaultSiteContent, defaultStoryContent, getSiteMedia, getStoryContent, siteMediaSections, type SiteMediaItem } from "../lib/site-content";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const emptyProduct: Product = {
  slug: "",
  name: "",
  category: "Bags",
  audience: ["Women", "Men"],
  price: "",
  image: "",
  description: "",
  inventory: 0,
  published: true,
  sizes: ["One size"],
};

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"insights" | "products" | "categories" | "content" | "orders">("insights");
  const [contentMode, setContentMode] = useState<"media" | "story">("media");
  const [insights, setInsights] = useState<StoreInsights | null>(null);
  const [insightsPeriod, setInsightsPeriod] = useState<7 | 30 | 90>(30);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [contentItems, setContentItems] = useState<SiteMediaItem[]>(getSiteMedia());
  const [contentDraft, setContentDraft] = useState<SiteMediaItem>(createSiteMediaEntry({ section: "hero" }));
  const [storyContent, setStoryContent] = useState(getStoryContent());
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [sizesInput, setSizesInput] = useState("");
  const [originalSlug, setOriginalSlug] = useState<string>();
  const [uploading, setUploading] = useState(false);

  const loadDashboard = async () => {
    const [catalogResult, categoryResult, orderResult, insightsResult, contentResult, storyResult] = await Promise.allSettled([
      adminApi.products(),
      adminApi.categories(),
      adminApi.orders(),
      adminApi.insights(insightsPeriod),
      adminApi.siteMedia(),
      adminApi.storyContent(),
    ]);

    if (catalogResult.status === "fulfilled") setProducts(catalogResult.value);
    if (categoryResult.status === "fulfilled") setCategories(categoryResult.value.map((category) => category.name));
    if (orderResult.status === "fulfilled") {
      setOrders(orderResult.value.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }
    if (insightsResult.status === "fulfilled") setInsights(insightsResult.value);
    if (contentResult.status === "fulfilled") setContentItems(contentResult.value.length ? contentResult.value : getSiteMedia());
    if (storyResult.status === "fulfilled" && storyResult.value) setStoryContent({ ...defaultStoryContent, ...storyResult.value });

    const dashboardError = [catalogResult, categoryResult, orderResult, insightsResult, contentResult, storyResult].find((result) => result.status === "rejected");
    setMessage(dashboardError?.status === "rejected"
      ? dashboardError.reason instanceof Error ? dashboardError.reason.message : "Unable to load dashboard"
      : "");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) void loadDashboard();
  }, [session, insightsPeriod]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setMessage("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable admin access.");
      return;
    }
    setMessage("Signing in…");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setMessage(error ? error.message : "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in");
    }
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      await adminApi.saveProduct({ ...editing, sizes: normalizeProductSizes(sizesInput) }, originalSlug);
      setEditing(null);
      setOriginalSlug(undefined);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save product");
    }
  };

  const removeProduct = async (slug: string) => {
    if (!window.confirm("Remove this product from the catalog?")) return;
    try {
      await adminApi.deleteProduct(slug);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to remove product");
    }
  };

  const createCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    try {
      await adminApi.saveCategory(name);
      setNewCategory("");
      setMessage("");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create category");
    }
  };

  const removeCategory = async (name: string) => {
    if (!window.confirm(`Delete the ${name} category?`)) return;
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    try {
      await adminApi.deleteCategory(slug);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to remove category");
    }
  };

  const resetContentDraft = () => setContentDraft({ ...createSiteMediaEntry({ section: "hero" }), id: "" });

  const saveContentItem = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = {
      ...contentDraft,
      title: contentDraft.title.trim(),
      subtitle: contentDraft.subtitle.trim(),
      alt: contentDraft.alt.trim() || contentDraft.title.trim(),
      image: contentDraft.image.trim(),
      href: contentDraft.href.trim() || "/shop",
    };

    if (!cleaned.image) {
      setMessage("Add an image URL before saving a media item.");
      return;
    }

    const remainingItems = contentItems.filter((item) => item.id !== cleaned.id);
    const sectionPosition = remainingItems.findIndex((item) => item.section === cleaned.section);
    remainingItems.splice(sectionPosition < 0 ? remainingItems.length : sectionPosition, 0, cleaned);
    const nextItems = remainingItems;

    try {
      const savedItems = await adminApi.saveSiteMedia(nextItems);
      setContentItems(savedItems);
      setMessage("Media saved and published to the storefront.");
      resetContentDraft();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save site media");
    }
  };

  const removeContentItem = async (id: string) => {
    const nextItems = contentItems.filter((item) => item.id !== id);
    try {
      const savedItems = await adminApi.saveSiteMedia(nextItems);
      setContentItems(savedItems.length ? savedItems : defaultSiteContent);
      setMessage("Media removed from the storefront.");
      if (contentDraft.id === id) resetContentDraft();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to remove site media");
    }
  };

  const saveStorySettings = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const savedStory = await adminApi.saveStoryContent(storyContent);
      setStoryContent(savedStory);
      setMessage("Story content saved and published to the storefront.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save story content");
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await adminApi.updateOrder(id, status);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update order");
    }
  };

  const uploadImage = async (file: File, onComplete: (url: string) => void) => {
    setUploading(true);
    setMessage("Uploading image…");
    try {
      const { url } = await adminApi.uploadImage(file);
      onComplete(url);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload image");
    } finally {
      setUploading(false);
    }
  };

  const uploadContentImage = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    setMessage("Uploading content image…");
    try {
      const { url } = await adminApi.uploadImage(file);
      setContentDraft((current) => ({ ...current, image: url }));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload content image");
    } finally {
      setUploading(false);
    }
  };

  const uploadStoryImage = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    setMessage("Uploading story image…");
    try {
      const { url } = await adminApi.uploadImage(file);
      setStoryContent((current) => ({ ...current, image: url }));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload story image");
    } finally {
      setUploading(false);
    }
  };

  const uploadProductImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMessage("Uploading product images…");
    try {
      const uploaded = await Promise.all(Array.from(files, (file) => adminApi.uploadImage(file)));
      setEditing((current) => {
        if (!current) return current;
        const nextImages = [...(current.images ?? []), ...uploaded.map(({ url }) => url).filter((url) => url !== current.image)];
        return { ...current, image: current.image || nextImages.shift() || "", images: nextImages };
      });
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload product images");
    } finally {
      setUploading(false);
    }
  };

  const setProductCover = (image: string) => {
    setEditing((current) => current ? {
      ...current,
      image,
      images: [...(current.images ?? []).filter((url) => url !== image), ...(current.image && current.image !== image ? [current.image] : [])],
    } : current);
  };

  const removeProductImage = (image: string) => {
    setEditing((current) => {
      if (!current) return current;
      const remaining = [current.image, ...(current.images ?? [])].filter((url) => url && url !== image);
      return { ...current, image: remaining[0] ?? "", images: remaining.slice(1) };
    });
  };

  if (!session) {
    return (
      <main className="grid min-h-screen bg-forest px-5 py-16 text-sand lg:grid-cols-2">
        <div className="hidden items-end p-14 lg:flex">
          <div>
            <span className="eyebrow text-gold">SHABA operations</span>
            <h1 className="mt-6 max-w-xl font-serif text-6xl leading-tight">Manage the collection with care.</h1>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <form className="w-full max-w-md rounded-3xl bg-sand p-8 text-forest sm:p-12" onSubmit={signIn}>
            <BrandLogo />
            <h2 className="mt-10 font-serif text-4xl">Admin sign in</h2>
            <p className="mt-3 text-sm leading-6 text-forest/60">Use an administrator account created in Supabase Authentication.</p>
            <label className="mt-8 block text-[10px] font-semibold uppercase tracking-[0.16em]">
              Email
              <input className="mt-2 w-full border-b border-forest/25 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            </label>
            <label className="mt-6 block text-[10px] font-semibold uppercase tracking-[0.16em]">
              Password
              <input className="mt-2 w-full border-b border-forest/25 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
            </label>
            <button className="mt-8 w-full rounded-full bg-forest px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-sand hover:bg-gold hover:text-forest">Sign in</button>
            {message && <p className="mt-5 text-sm text-brass">{message}</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3eee6] text-forest">
      <header className="border-b border-forest/10 bg-forest px-5 py-5 text-sand sm:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-gold">SHABA</p>
            <h1 className="font-serif text-2xl">Store administration</h1>
          </div>
          <button className="text-[10px] uppercase tracking-[0.16em] text-sand/70 hover:text-sand" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8">
        <div className="flex flex-col justify-between gap-6 border-b border-forest/15 pb-7 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow text-brass">Dashboard</span>
            <h2 className="mt-2 font-serif text-4xl">Catalog and orders</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["insights", "products", "categories", "content", "orders"] as const).map((item) => (
              <button className={`rounded-full px-5 py-3 text-xs font-semibold capitalize ${tab === item ? "bg-forest text-sand" : "bg-forest/5"}`} key={item} onClick={() => setTab(item)}>{item}</button>
            ))}
          </div>
        </div>
        {message && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-brass/30 bg-brass/10 p-4 text-sm">
            <span>{message}</span>
            <button className="font-semibold underline" onClick={loadDashboard} type="button">Retry</button>
          </div>
        )}

        {tab === "insights" ? (
          <section className="mt-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">Store pulse</p>
                <h3 className="mt-1 font-serif text-3xl">The business, at a glance.</h3>
                <p className="mt-2 text-xs text-forest/55">A random browser ID counts returning visits. Analytics do not collect contact details or IP addresses.</p>
              </div>
              <label className="text-[9px] font-semibold uppercase tracking-[0.14em] text-forest/55">Reporting period
                <select className="ml-3 rounded-full border border-forest/15 bg-transparent px-4 py-3 text-xs text-forest" onChange={(event) => setInsightsPeriod(Number(event.target.value) as 7 | 30 | 90)} value={insightsPeriod}>
                  <option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option>
                </select>
              </label>
            </div>
            {!insights ? (
              <div className="rounded-2xl bg-white p-8 text-sm text-forest/55">Insights are not available yet. Check the analytics migration and Edge Function deployment, then retry.</div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <InsightMetric label="Visits" value={insights.visits.toLocaleString()} note={`${insights.uniqueVisitors.toLocaleString()} unique browsers`} />
                  <InsightMetric label="Clicks" value={insights.clicks.toLocaleString()} note={`${insights.productViews.toLocaleString()} product views`} />
                  <InsightMetric label="Added to bag" value={insights.addToCart.toLocaleString()} note={`${insights.checkoutStarts.toLocaleString()} checkout starts`} />
                  <InsightMetric label="Orders" value={insights.orders.toLocaleString()} note={`${formatBif(insights.orderValue)} recorded order value`} />
                  <InsightMetric label="Average order" value={formatBif(insights.averageOrderValue)} note={`${insights.conversionRate.toFixed(1)}% visit-to-order rate`} />
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
                  <section className="rounded-2xl bg-white p-5 sm:p-7">
                    <div className="flex items-end justify-between gap-4">
                      <div><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brass">Traffic & orders</p><h4 className="mt-1 font-serif text-2xl">Daily activity</h4></div>
                      <div className="flex gap-4 text-[9px] uppercase tracking-[0.12em] text-forest/55"><span><i className="mr-1 inline-block size-2 bg-olive" />Visits</span><span><i className="mr-1 inline-block size-2 bg-gold" />Orders</span></div>
                    </div>
                    <div className="mt-7 flex h-44 items-end gap-[3px] border-b border-forest/10 pb-2 sm:gap-1" role="img" aria-label={`Daily visits and orders in the last ${insights.periodDays} days`}>
                      {insights.daily.map((day) => {
                        const max = Math.max(1, ...insights.daily.map((entry) => entry.visits));
                        return (
                          <div className="flex h-full min-w-0 flex-1 items-end justify-center gap-[2px]" key={day.date} title={`${day.date}: ${day.visits} visits, ${day.orders} orders`}>
                            <span className="w-1/2 bg-olive/75 sm:max-w-3" style={{ height: `${Math.max(day.visits ? 5 : 1, (day.visits / max) * 100)}%` }} />
                            <span className="w-1/2 bg-gold sm:max-w-3" style={{ height: `${Math.max(day.orders ? 5 : 1, (day.orders / max) * 100)}%` }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex justify-between text-[9px] text-forest/45"><span>{insights.daily[0]?.date}</span><span>{insights.daily[insights.daily.length - 1]?.date}</span></div>
                  </section>

                  <section className="rounded-2xl bg-[#e1d7c8] p-5 sm:p-7">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brass">Shopping journey</p>
                    <h4 className="mt-1 font-serif text-2xl">From visit to order</h4>
                    <div className="mt-6 space-y-4">
                      <FunnelStep label="Visits" value={insights.visits} total={insights.visits} />
                      <FunnelStep label="Product views" value={insights.productViews} total={insights.visits} />
                      <FunnelStep label="Added to bag" value={insights.addToCart} total={insights.visits} />
                      <FunnelStep label="Checkout started" value={insights.checkoutStarts} total={insights.visits} />
                      <FunnelStep label="Orders saved" value={insights.orders} total={insights.visits} />
                    </div>
                  </section>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <InsightsList title="Popular pages" empty="No page visits recorded in this period." items={insights.topPages.map((item) => ({ label: item.path, value: `${item.views} views` }))} />
                  <InsightsList title="Products getting attention" empty="No product activity recorded in this period." items={insights.topProducts.map((item) => ({ label: item.slug, value: `${item.views} views · ${item.adds} bag adds` }))} />
                </div>

                <section className="mt-5 rounded-2xl bg-white p-5 sm:p-7">
                  <div className="flex items-end justify-between gap-4"><div><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brass">Latest activity</p><h4 className="mt-1 font-serif text-2xl">Recent orders</h4></div><button className="text-[9px] font-semibold uppercase tracking-[0.12em] underline" onClick={() => setTab("orders")} type="button">Manage orders</button></div>
                  {insights.recentOrders.length ? <div className="mt-5 divide-y divide-forest/10">
                    {insights.recentOrders.slice(0, 5).map((order) => <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs" key={order.id}><span>{order.customer?.name ?? "Customer"} · {new Date(order.createdAt).toLocaleDateString()}</span><span className="font-semibold">{order.total}</span><span className="rounded-full bg-olive/10 px-3 py-1 text-[9px] uppercase tracking-[0.1em]">{order.status}</span></div>)}
                  </div> : <p className="mt-5 text-xs text-forest/50">No orders recorded in this period.</p>}
                </section>
              </>
            )}
          </section>
        ) : tab === "products" ? (
          <section className="mt-8">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-forest/60">{products.length} products</p>
              <button className="rounded-full bg-gold px-5 py-3 text-xs font-semibold" onClick={() => { setEditing({ ...emptyProduct, category: categories[0] ?? "" }); setSizesInput(normalizeProductSizes(emptyProduct.sizes).join(", ")); setOriginalSlug(undefined); }}>Add product</button>
            </div>
            <div className="overflow-x-auto rounded-2xl bg-white">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-forest/10 text-[9px] uppercase tracking-[0.16em] text-forest/50">
                  <tr><th className="p-5">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th className="pr-5 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr className="border-b border-forest/8 last:border-0" key={product.slug}>
                      <td className="p-5"><div className="flex items-center gap-4"><img alt="" className="size-14 rounded-lg object-cover" src={product.image} /><strong>{product.name}</strong></div></td>
                      <td>{product.category}</td><td>{product.price}</td><td>{product.inventory ?? 0}</td>
                      <td><span className={`rounded-full px-3 py-1 text-[10px] ${product.published === false ? "bg-brass/10 text-brass" : "bg-olive/10 text-olive"}`}>{product.published === false ? "Draft" : "Published"}</span></td>
                      <td className="pr-5 text-right">
                        <button className="mr-4 text-xs font-semibold" onClick={() => { setEditing({ ...product }); setSizesInput(normalizeProductSizes(product.sizes).join(", ")); setOriginalSlug(product.slug); }}>Edit</button>
                        <button className="text-xs text-brass" onClick={() => removeProduct(product.slug)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : tab === "categories" ? (
          <section className="mt-8">
            <form className="flex max-w-xl flex-col gap-3 rounded-2xl bg-white p-5 sm:flex-row" onSubmit={createCategory}>
              <input aria-label="New category name" className="min-w-0 flex-1 border-b border-forest/20 bg-transparent px-2 py-3 text-sm outline-none focus:border-forest" onChange={(event) => setNewCategory(event.target.value)} placeholder="e.g. Clothing" required value={newCategory} />
              <button className="rounded-full bg-gold px-5 py-3 text-xs font-semibold" type="submit">Create category</button>
            </form>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <article className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5" key={category}>
                  <div>
                    <h3 className="font-semibold">{category}</h3>
                    <p className="mt-1 text-xs text-forest/55">{products.filter((product) => product.category === category).length} products</p>
                  </div>
                  <button aria-label={`Delete ${category} category`} className="text-xs text-brass underline" onClick={() => removeCategory(category)} type="button">Delete</button>
                </article>
              ))}
            </div>
          </section>
        ) : tab === "content" ? (
          <section className="mt-8 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-5 rounded-2xl bg-[#e7dfd3] p-5 sm:p-7">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brass">Storefront content</p>
                <h3 className="mt-1 font-serif text-3xl">Manage what visitors see</h3>
                <p className="mt-2 text-xs text-forest/55">Changes are saved to the shared store and load on the public website.</p>
              </div>
              <div aria-label="Content type" className="flex rounded-full bg-white p-1" role="group">
                <button aria-pressed={contentMode === "media"} className={`rounded-full px-5 py-3 text-xs font-semibold ${contentMode === "media" ? "bg-forest text-sand" : "text-forest/65"}`} onClick={() => setContentMode("media")} type="button">Homepage media</button>
                <button aria-pressed={contentMode === "story"} className={`rounded-full px-5 py-3 text-xs font-semibold ${contentMode === "story" ? "bg-forest text-sand" : "text-forest/65"}`} onClick={() => setContentMode("story")} type="button">Our story</button>
              </div>
            </div>

            {contentMode === "media" ? <div className="grid items-start gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <form className="rounded-2xl bg-white p-5 sm:p-7" onSubmit={saveContentItem}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brass">Brand media</p>
                  <h3 className="mt-1 font-serif text-3xl">Hero and landing visuals</h3>
                </div>
                <button className="text-[9px] font-semibold uppercase tracking-[0.12em] underline" onClick={resetContentDraft} type="button">New item</button>
              </div>
              <label className="mt-6 block text-[10px] font-semibold uppercase tracking-[0.14em]">Section
                <select className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm" onChange={(event) => setContentDraft({ ...contentDraft, section: event.target.value as SiteMediaItem["section"] })} value={contentDraft.section}>
                  {siteMediaSections.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}
                </select>
              </label>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Title
                <input className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setContentDraft({ ...contentDraft, title: event.target.value })} value={contentDraft.title} />
              </label>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Subtitle
                <input className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setContentDraft({ ...contentDraft, subtitle: event.target.value })} value={contentDraft.subtitle} />
              </label>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Image URL
                <input className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setContentDraft({ ...contentDraft, image: event.target.value })} placeholder="https://..." value={contentDraft.image} />
              </label>
              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-forest/75">Upload image</p>
                <input
                  accept="image/*"
                  className="mt-3 block w-full cursor-pointer rounded-xl border border-dashed border-forest/20 bg-[#f7f3ee] px-3 py-4 text-xs text-forest/70 file:mr-4 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.14em] file:text-sand"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    void uploadContentImage(file);
                    event.target.value = "";
                  }}
                  type="file"
                />
                {contentDraft.image && <img alt={contentDraft.alt || contentDraft.title || "Selected media preview"} className="mt-3 h-44 w-full rounded-xl object-cover" src={contentDraft.image} />}
              </div>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Link
                <input className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setContentDraft({ ...contentDraft, href: event.target.value })} value={contentDraft.href} />
              </label>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Alt text
                <input className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setContentDraft({ ...contentDraft, alt: event.target.value })} value={contentDraft.alt} />
              </label>
              <button className="mt-8 w-full rounded-full bg-forest px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-sand hover:bg-gold hover:text-forest disabled:opacity-50" disabled={uploading} type="submit">{uploading ? "Uploading…" : contentItems.some((item) => item.id === contentDraft.id) ? "Save and publish" : "Add and publish"}</button>
            </form>

            <div className="space-y-3">
              {siteMediaSections.map(({ value, label }) => (
                <article className="rounded-2xl bg-white p-4" key={value}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="font-serif text-2xl">{label}</h4>
                    <span className="text-[9px] uppercase tracking-[0.12em] text-forest/50">{contentItems.filter((item) => item.section === value).length}</span>
                  </div>
                  {contentItems.filter((item) => item.section === value).length ? (
                    <div className="space-y-2">
                      {contentItems.filter((item) => item.section === value).map((item) => (
                        <div className="flex items-center gap-3 rounded-xl border border-forest/10 bg-[#f8f5f1] p-2" key={item.id}>
                          <img alt={item.alt || item.title} className="size-14 rounded-lg object-cover" src={item.image} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{item.title || "Untitled image"}</p>
                            <p className="truncate text-[10px] text-forest/55">{item.subtitle || "Custom SHABA artwork"}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button className="text-[9px] font-semibold underline" onClick={() => setContentDraft(item)} type="button">Edit</button>
                            <button className="text-[9px] text-brass underline" onClick={() => removeContentItem(item.id)} type="button">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-forest/50">No images saved for this section yet.</p>
                  )}
                </article>
              ))}
            </div>
            </div> : <form className="mx-auto max-w-4xl rounded-2xl bg-white p-5 sm:p-7" onSubmit={saveStorySettings}>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brass">Story page</p>
              <h3 className="mt-1 font-serif text-3xl">Edit narrative</h3>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Eyebrow
                <input className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setStoryContent({ ...storyContent, eyebrow: event.target.value })} value={storyContent.eyebrow} />
              </label>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Title
                <input className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setStoryContent({ ...storyContent, title: event.target.value })} value={storyContent.title} />
              </label>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Intro copy
                <textarea className="mt-2 min-h-24 w-full rounded-xl border border-forest/15 bg-transparent p-4 text-sm leading-6" onChange={(event) => setStoryContent({ ...storyContent, intro: event.target.value })} value={storyContent.intro} />
              </label>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Main image URL
                <input className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setStoryContent({ ...storyContent, image: event.target.value })} value={storyContent.image} />
              </label>
              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-forest/75">Story image preview</p>
                {storyContent.image ? (
                  <img alt="Story preview" className="mt-3 h-44 w-full rounded-2xl object-cover" src={storyContent.image} />
                ) : (
                  <div className="mt-3 flex h-44 items-center justify-center rounded-2xl border border-dashed border-forest/20 bg-[#f7f3ee] text-xs text-forest/55">No image yet</div>
                )}
                <input
                  accept="image/*"
                  className="mt-3 block w-full cursor-pointer rounded-xl border border-dashed border-forest/20 bg-[#f7f3ee] px-3 py-4 text-xs text-forest/70 file:mr-4 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.14em] file:text-sand"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    void uploadStoryImage(file);
                    event.target.value = "";
                  }}
                  type="file"
                />
              </div>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Secondary title
                <input className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setStoryContent({ ...storyContent, secondaryTitle: event.target.value })} value={storyContent.secondaryTitle} />
              </label>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Secondary paragraph
                <textarea className="mt-2 min-h-24 w-full rounded-xl border border-forest/15 bg-transparent p-4 text-sm leading-6" onChange={(event) => setStoryContent({ ...storyContent, secondaryCopy: event.target.value })} value={storyContent.secondaryCopy} />
              </label>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Second paragraph
                <textarea className="mt-2 min-h-24 w-full rounded-xl border border-forest/15 bg-transparent p-4 text-sm leading-6" onChange={(event) => setStoryContent({ ...storyContent, secondaryCopyTwo: event.target.value })} value={storyContent.secondaryCopyTwo} />
              </label>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Values heading
                <input className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setStoryContent({ ...storyContent, valuesTitle: event.target.value })} value={storyContent.valuesTitle} />
              </label>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Future title
                <input className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => setStoryContent({ ...storyContent, futureTitle: event.target.value })} value={storyContent.futureTitle} />
              </label>
              <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Future copy
                <textarea className="mt-2 min-h-24 w-full rounded-xl border border-forest/15 bg-transparent p-4 text-sm leading-6" onChange={(event) => setStoryContent({ ...storyContent, futureCopy: event.target.value })} value={storyContent.futureCopy} />
              </label>
              <button className="mt-8 w-full rounded-full bg-forest px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-sand hover:bg-gold hover:text-forest" disabled={uploading} type="submit">Save and publish story</button>
            </form>}
          </section>
        ) : (
          <section className="mt-8 space-y-4">
            {!orders.length && <div className="rounded-2xl bg-white p-12 text-center"><h3 className="font-serif text-3xl">No orders yet</h3><p className="mt-3 text-sm text-forest/55">New orders will appear here.</p></div>}
            {orders.map((order) => (
              <article className="grid items-center gap-5 rounded-2xl bg-white p-6 sm:grid-cols-[1fr_1fr_auto]" key={order.id}>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-brass">Order {order.id.slice(0, 8)}</p>
                  <p className="mt-2 text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                  {order.customer && <div className="mt-3 space-y-1 text-xs text-forest/60">
                    <p>{order.customer.name} · {order.customer.phone}</p>
                    <p>{order.customer.fulfillment}{order.customer.area ? ` · ${order.customer.area}` : ""}</p>
                    {order.customer.note && <p>Note: {order.customer.note}</p>}
                  </div>}
                </div>
                <div>
                  <p className="font-semibold">{order.total}</p>
                  <div className="mt-2 space-y-1 text-xs text-forest/55">
                    {order.items.map((item, index) => <p key={`${item.name}-${index}`}>{item.name} · {item.size ?? "One size"} × {item.quantity}</p>)}
                  </div>
                </div>
                <select className="rounded-full border border-forest/15 bg-transparent px-4 py-3 text-xs" onChange={(event) => updateOrderStatus(order.id, event.target.value)} value={order.status}>
                  {["new", "confirmed", "making", "ready", "completed", "cancelled"].map((status) => <option key={status}>{status}</option>)}
                </select>
              </article>
            ))}
          </section>
        )}
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-forest/45">
          <form className="h-full w-full max-w-xl overflow-y-auto bg-sand p-7 shadow-2xl sm:p-10" onSubmit={saveProduct}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-3xl">{originalSlug ? "Edit product" : "New product"}</h2>
              <button aria-label="Close editor" className="text-2xl" onClick={() => setEditing(null)} type="button">×</button>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <AdminField label="Name" value={editing.name} onChange={(name) => setEditing({ ...editing, name })} />
              <AdminField label="Slug" value={editing.slug} onChange={(slug) => setEditing({ ...editing, slug })} />
              <label className="text-[10px] font-semibold uppercase tracking-[0.14em]">Category
                <select className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm" onChange={(event) => setEditing({ ...editing, category: event.target.value })} required value={editing.category}>
                  {!categories.includes(editing.category) && editing.category && <option>{editing.category}</option>}
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <AdminField label="Price" value={editing.price} onChange={(price) => setEditing({ ...editing, price })} />
              <AdminField label="Inventory" type="number" value={String(editing.inventory ?? 0)} onChange={(inventory) => setEditing({ ...editing, inventory: Number(inventory) })} />
              <label className="text-[10px] font-semibold uppercase tracking-[0.14em]">Audience
                <select className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm" onChange={(event) => setEditing({ ...editing, audience: event.target.value === "Both" ? ["Women", "Men"] : [event.target.value] })} value={editing.audience.length === 2 ? "Both" : editing.audience[0]}>
                  <option>Both</option><option>Women</option><option>Men</option>
                </select>
              </label>
            </div>
            <AdminField label="Size variants (comma separated)" value={sizesInput} onChange={setSizesInput} />
            <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Product images
              <span className="mt-1 block normal-case tracking-normal text-forest/50">Add multiple photos. Choose which one appears as the main product image.</span>
              <input accept="image/*" className="mt-2 block w-full rounded-xl border border-forest/15 p-4 text-xs" disabled={uploading} multiple onChange={(event) => { uploadProductImages(event.target.files); event.currentTarget.value = ""; }} type="file" />
            </label>
            {!!(editing.image || editing.images?.length) && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[editing.image, ...(editing.images ?? [])].filter(Boolean).map((image, index) => (
                <div className="overflow-hidden rounded-xl border border-forest/10 bg-white p-2" key={`${image}-${index}`}>
                  <img alt={index === 0 ? "Main product preview" : `Product image ${index + 1}`} className="aspect-square w-full rounded-lg object-cover" src={image} />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {index === 0 ? <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-olive">Main image</span> : <button className="text-[9px] font-semibold underline" onClick={() => setProductCover(image)} type="button">Set as main</button>}
                    <button aria-label={`Remove product image ${index + 1}`} className="text-[9px] text-brass underline" onClick={() => removeProductImage(image)} type="button">Remove</button>
                  </div>
                </div>
              ))}
            </div>}
            <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Description
              <textarea className="mt-2 min-h-32 w-full rounded-xl border border-forest/15 bg-transparent p-4 text-sm leading-6" onChange={(event) => setEditing({ ...editing, description: event.target.value })} value={editing.description} />
            </label>
            <label className="mt-5 flex items-center gap-3 text-sm"><input checked={editing.published !== false} onChange={(event) => setEditing({ ...editing, published: event.target.checked })} type="checkbox" /> Published in storefront</label>
            <button className="mt-8 w-full rounded-full bg-forest px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-sand hover:bg-gold hover:text-forest">Save product</button>
          </form>
        </div>
      )}

    </div>
  );
}

function AdminField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">{label}
      <input className="mt-2 w-full border-b border-forest/20 bg-transparent py-3 text-sm outline-none focus:border-forest" onChange={(event) => onChange(event.target.value)} required type={type} value={value} />
    </label>
  );
}

function formatBif(value: number) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} BIF`;
}

function InsightMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-2xl bg-white p-5 sm:p-6">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-forest/50">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">{value}</p>
      <p className="mt-2 text-[10px] text-forest/50">{note}</p>
    </article>
  );
}

function FunnelStep({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total ? Math.max(value ? 3 : 0, (value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-[10px]"><span>{label}</span><strong>{value.toLocaleString()}</strong></div>
      <div className="h-1.5 bg-forest/10"><div className="h-full bg-olive transition-[width]" style={{ width: `${width}%` }} /></div>
    </div>
  );
}

function InsightsList({ title, empty, items }: { title: string; empty: string; items: Array<{ label: string; value: string }> }) {
  return (
    <section className="rounded-2xl bg-white p-5 sm:p-7">
      <h4 className="font-serif text-2xl">{title}</h4>
      {items.length ? <div className="mt-4 divide-y divide-forest/10">
        {items.map((item) => <div className="flex items-center justify-between gap-4 py-3 text-xs" key={item.label}><span className="truncate">{item.label}</span><span className="shrink-0 text-forest/55">{item.value}</span></div>)}
      </div> : <p className="mt-4 text-xs text-forest/50">{empty}</p>}
    </section>
  );
}
