import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { normalizeProductSizes, type Product } from "../data";
import { adminApi, type OrderRecord } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { JournalEntry } from "../journals";

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

const emptyJournal: JournalEntry = {
  slug: "",
  category: "Studio notes",
  title: "",
  excerpt: "",
  image: "",
  body: [""],
  published: true,
};

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [journalApiError, setJournalApiError] = useState("");
  const [tab, setTab] = useState<"products" | "journals" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [sizesInput, setSizesInput] = useState("");
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string>();
  const [uploading, setUploading] = useState(false);

  const loadDashboard = async () => {
    const [catalogResult, journalResult, orderResult] = await Promise.allSettled([
      adminApi.products(),
      adminApi.journals(),
      adminApi.orders(),
    ]);

    if (catalogResult.status === "fulfilled") setProducts(catalogResult.value);
    if (orderResult.status === "fulfilled") {
      setOrders(orderResult.value.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }
    if (journalResult.status === "fulfilled") {
      setJournals(journalResult.value);
      setJournalApiError("");
    } else {
      setJournals([]);
      setJournalApiError(journalResult.reason instanceof Error ? journalResult.reason.message : "Unable to load journal stories");
    }

    const dashboardError = [catalogResult, orderResult].find((result) => result.status === "rejected");
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
    if (session) loadDashboard();
  }, [session]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("Signing in…");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "");
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

  const saveJournal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingJournal) return;
    try {
      await adminApi.saveJournal(editingJournal, originalSlug);
      setEditingJournal(null);
      setOriginalSlug(undefined);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save journal");
    }
  };

  const removeJournal = async (slug: string) => {
    if (!window.confirm("Remove this journal story?")) return;
    try {
      await adminApi.deleteJournal(slug);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to remove journal story");
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
            <div aria-hidden="true" className="brand-logo-art" />
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
          <div className="flex gap-2">
            {(["products", "journals", "orders"] as const).map((item) => (
              <button className={`rounded-full px-5 py-3 text-xs font-semibold capitalize ${tab === item ? "bg-forest text-sand" : "bg-forest/5"}`} key={item} onClick={() => setTab(item)}>{item}</button>
            ))}
          </div>
        </div>
        {message && <div className="mt-6 border border-brass/30 bg-brass/10 p-4 text-sm">{message}</div>}

        {tab === "products" ? (
          <section className="mt-8">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-forest/60">{products.length} products</p>
              <button className="rounded-full bg-gold px-5 py-3 text-xs font-semibold" onClick={() => { setEditing({ ...emptyProduct }); setSizesInput(normalizeProductSizes(emptyProduct.sizes).join(", ")); setOriginalSlug(undefined); }}>Add product</button>
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
        ) : tab === "journals" ? (
          <section className="mt-8">
            {journalApiError && <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border border-brass/30 bg-brass/10 p-4 text-sm"><span>Journal management is unavailable: {journalApiError}. Deploy the latest Supabase Edge Function to enable it.</span><button className="font-semibold underline" onClick={loadDashboard}>Retry</button></div>}
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-forest/60">{journals.length} journal stories</p>
              <button className="rounded-full bg-gold px-5 py-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={Boolean(journalApiError)} onClick={() => { setEditingJournal({ ...emptyJournal, body: [""] }); setOriginalSlug(undefined); }}>Add story</button>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {journals.map((journal) => (
                <article className="overflow-hidden rounded-2xl bg-white" key={journal.slug}>
                  <img alt="" className="aspect-[16/9] w-full object-cover" src={journal.image} />
                  <div className="p-6">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-brass">{journal.category}</p>
                    <h3 className="mt-2 font-serif text-2xl">{journal.title}</h3>
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-forest/55">{journal.excerpt}</p>
                    <div className="mt-6 flex justify-between">
                      <button className="text-xs font-semibold" disabled={Boolean(journalApiError)} onClick={() => { setEditingJournal({ ...journal, body: [...journal.body] }); setOriginalSlug(journal.slug); }}>Edit</button>
                      <button className="text-xs text-brass" disabled={Boolean(journalApiError)} onClick={() => removeJournal(journal.slug)}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
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
              <AdminField label="Category" value={editing.category} onChange={(category) => setEditing({ ...editing, category })} />
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

      {editingJournal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-forest/45">
          <form className="h-full w-full max-w-2xl overflow-y-auto bg-sand p-7 shadow-2xl sm:p-10" onSubmit={saveJournal}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-3xl">{originalSlug ? "Edit journal story" : "New journal story"}</h2>
              <button aria-label="Close editor" className="text-2xl" onClick={() => setEditingJournal(null)} type="button">×</button>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <AdminField label="Title" value={editingJournal.title} onChange={(title) => setEditingJournal({ ...editingJournal, title })} />
              <AdminField label="Slug" value={editingJournal.slug} onChange={(slug) => setEditingJournal({ ...editingJournal, slug })} />
              <AdminField label="Category" value={editingJournal.category} onChange={(category) => setEditingJournal({ ...editingJournal, category })} />
            </div>
            <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Cover image
              <input accept="image/*" className="mt-2 block w-full rounded-xl border border-forest/15 p-4 text-xs" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadImage(file, (image) => setEditingJournal({ ...editingJournal, image })); }} type="file" />
            </label>
            {editingJournal.image && <img alt="Story preview" className="mt-4 aspect-[16/9] w-full rounded-xl object-cover" src={editingJournal.image} />}
            <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Excerpt
              <textarea className="mt-2 min-h-24 w-full rounded-xl border border-forest/15 bg-transparent p-4 text-sm leading-6" onChange={(event) => setEditingJournal({ ...editingJournal, excerpt: event.target.value })} value={editingJournal.excerpt} />
            </label>
            <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.14em]">Article body
              <textarea className="mt-2 min-h-72 w-full rounded-xl border border-forest/15 bg-transparent p-4 text-sm leading-7" onChange={(event) => setEditingJournal({ ...editingJournal, body: event.target.value.split("\n\n") })} value={editingJournal.body.join("\n\n")} />
              <span className="mt-2 block normal-case tracking-normal text-forest/45">Separate paragraphs with a blank line.</span>
            </label>
            <label className="mt-5 flex items-center gap-3 text-sm"><input checked={editingJournal.published !== false} onChange={(event) => setEditingJournal({ ...editingJournal, published: event.target.checked })} type="checkbox" /> Published in journal</label>
            <button className="mt-8 w-full rounded-full bg-forest px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-sand hover:bg-gold hover:text-forest">Save story</button>
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
