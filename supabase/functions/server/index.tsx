import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-16e069d6/health", (c) => {
  return c.json({ status: "ok" });
});

const prefix = "/make-server-16e069d6";

const starterProducts = [
  {
    slug: "bujumbura-cross",
    name: "Bujumbura Cross",
    category: "Sandals",
    audience: ["Women", "Men"],
    price: "145,000 BIF",
    image: "https://images.unsplash.com/photo-1613662632164-7f2b081a5b46?auto=format&fit=crop&w=1200&q=88",
    description: "A quietly confident sandal cut from full-grain leather, shaped for everyday movement and finished by hand in Bujumbura.",
    inventory: 18,
    published: true,
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
    inventory: 9,
    published: true,
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
    inventory: 24,
    published: true,
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
    inventory: 7,
    published: true,
    sizes: ["One size"],
  },
];

const starterJournals = [
  {
    slug: "leather-that-lives",
    category: "Materials",
    title: "Why full-grain leather gets better with time",
    excerpt: "A closer look at patina, natural character, and why we choose leather that records the life lived with it.",
    image: "https://images.unsplash.com/photo-1496180317060-d2026272f138?auto=format&fit=crop&w=1400&q=88",
    body: [
      "Full-grain leather keeps the strongest, most expressive surface of the hide intact. Its marks and subtle variations are not defects; they are the beginning of a material that will become more personal with use.",
      "Over time, sunlight, movement, and the oils from your hands deepen its tone and soften its structure. This evolving finish is called patina, and it is one of the reasons a well-made leather object can feel more valuable after years than it did on day one.",
      "We select hides for strength, balance, and character, then finish them lightly so the material can continue to breathe and change. The result is an object that does not merely resist time—it responds to it.",
    ],
    published: true,
  },
  {
    slug: "inside-the-bujumbura-workshop",
    category: "Studio notes",
    title: "Inside a day at the Bujumbura workshop",
    excerpt: "From the first pattern to the last polished edge, follow the steady rhythm behind every SHABA piece.",
    image: "https://images.unsplash.com/photo-1628483211662-9bcc692c46dc?auto=format&fit=crop&w=1400&q=88",
    body: [
      "The workshop begins quietly. Patterns are checked, hides are laid out, and every cut is planned before a blade meets leather.",
      "The day moves between focused individual work and shared inspection. Edges are refined, hardware is set, and seams are tested by hand. Nothing is hurried because every later step depends on the accuracy of the one before it.",
      "By evening, finished pieces sit beside work still in progress—a visible record of patient skill and collective attention.",
    ],
    published: true,
  },
];

async function ensureCatalog() {
  const existing = await kv.getByPrefix("product:");
  if (existing.length) return existing;
  await kv.mset(
    starterProducts.map((product) => `product:${product.slug}`),
    starterProducts,
  );
  return starterProducts;
}

async function ensureJournals() {
  const existing = await kv.getByPrefix("journal:");
  if (existing.length) return existing;
  await kv.mset(
    starterJournals.map((journal) => `journal:${journal.slug}`),
    starterJournals,
  );
  return starterJournals;
}

async function requireAdmin(c: any) {
  const authorization = c.req.header("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}

app.get(`${prefix}/products`, async (c) => {
  try {
    const products = await ensureCatalog();
    return c.json(products.filter((product) => product.published !== false));
  } catch (error) {
    console.log("Catalog load error", error);
    return c.json({ error: "Unable to load products" }, 500);
  }
});

app.get(`${prefix}/products/:slug`, async (c) => {
  try {
    const product = await kv.get(`product:${c.req.param("slug")}`);
    return product ? c.json(product) : c.json({ error: "Product not found" }, 404);
  } catch (error) {
    console.log("Product load error", error);
    return c.json({ error: "Unable to load product" }, 500);
  }
});

app.get(`${prefix}/journals`, async (c) => {
  try {
    const journals = await ensureJournals();
    return c.json(journals.filter((journal) => journal.published !== false));
  } catch (error) {
    console.log("Journal load error", error);
    return c.json({ error: "Unable to load journal" }, 500);
  }
});

app.get(`${prefix}/journals/:slug`, async (c) => {
  const journal = await kv.get(`journal:${c.req.param("slug")}`);
  return journal ? c.json(journal) : c.json({ error: "Journal not found" }, 404);
});

app.post(`${prefix}/orders`, async (c) => {
  try {
    const input = await c.req.json();
    if (!Array.isArray(input.items) || !input.items.length) {
      return c.json({ error: "An order requires at least one item" }, 400);
    }
    const id = crypto.randomUUID();
    const order = {
      id,
      items: input.items,
      total: input.total ?? "",
      status: "new",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`order:${id}`, order);
    return c.json(order, 201);
  } catch (error) {
    console.log("Order create error", error);
    return c.json({ error: "Unable to create order" }, 500);
  }
});

app.get(`${prefix}/admin/products`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  return c.json(await ensureCatalog());
});

app.post(`${prefix}/admin/products`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  const product = await c.req.json();
  if (!product.slug || !product.name || !product.price) {
    return c.json({ error: "Slug, name, and price are required" }, 400);
  }
  await kv.set(`product:${product.slug}`, product);
  return c.json(product, 201);
});

app.put(`${prefix}/admin/products/:slug`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  const product = await c.req.json();
  const oldSlug = c.req.param("slug");
  if (!product.slug || !product.name || !product.price) {
    return c.json({ error: "Slug, name, and price are required" }, 400);
  }
  if (oldSlug !== product.slug) await kv.del(`product:${oldSlug}`);
  await kv.set(`product:${product.slug}`, product);
  return c.json(product);
});

app.delete(`${prefix}/admin/products/:slug`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  await kv.del(`product:${c.req.param("slug")}`);
  return c.json({ success: true });
});

app.get(`${prefix}/admin/orders`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  return c.json(await kv.getByPrefix("order:"));
});

app.put(`${prefix}/admin/orders/:id`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  const existing = await kv.get(`order:${c.req.param("id")}`);
  if (!existing) return c.json({ error: "Order not found" }, 404);
  const update = await c.req.json();
  const order = { ...existing, status: update.status ?? existing.status };
  await kv.set(`order:${order.id}`, order);
  return c.json(order);
});

app.get(`${prefix}/admin/journals`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  return c.json(await ensureJournals());
});

app.post(`${prefix}/admin/journals`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  const journal = await c.req.json();
  if (!journal.slug || !journal.title) return c.json({ error: "Slug and title are required" }, 400);
  await kv.set(`journal:${journal.slug}`, journal);
  return c.json(journal, 201);
});

app.put(`${prefix}/admin/journals/:slug`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  const journal = await c.req.json();
  const oldSlug = c.req.param("slug");
  if (!journal.slug || !journal.title) return c.json({ error: "Slug and title are required" }, 400);
  if (oldSlug !== journal.slug) await kv.del(`journal:${oldSlug}`);
  await kv.set(`journal:${journal.slug}`, journal);
  return c.json(journal);
});

app.delete(`${prefix}/admin/journals/:slug`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  await kv.del(`journal:${c.req.param("slug")}`);
  return c.json({ success: true });
});

app.post(`${prefix}/admin/upload`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  try {
    const form = await c.req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return c.json({ error: "Image file is required" }, 400);
    if (!file.type.startsWith("image/")) return c.json({ error: "Only image uploads are supported" }, 400);
    if (file.size > 8 * 1024 * 1024) return c.json({ error: "Image must be smaller than 8 MB" }, 400);
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const bucket = "shaba-media";
    const { error: bucketError } = await client.storage.createBucket(bucket, { public: true });
    if (bucketError && !bucketError.message.toLowerCase().includes("already exists")) {
      console.log("Bucket create error", bucketError);
    }
    const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from(bucket).upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return c.json({ url: data.publicUrl });
  } catch (error) {
    console.log("Image upload error", error);
    return c.json({ error: "Unable to upload image" }, 500);
  }
});

Deno.serve(app.fetch);
