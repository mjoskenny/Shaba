import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import { isAdminUser, normalizeAdminEmails } from "./admin_auth.js";
const app = new Hono();
const prefix = "/make-server-16e069d6";
const allowedOrigins = [...new Set([
  "https://shabacrafts.store",
  "https://www.shabacrafts.store",
  "http://localhost:8443",
  "http://localhost:8444",
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "").split(","),
].map((origin) => origin.trim()).filter(Boolean))];
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 60;
const clientRequestTimestamps = new Map<string, number[]>();

function cleanOrigin(origin: string | undefined) {
  if (!origin) return "";
  try {
    return new URL(origin).origin;
  } catch {
    return "";
  }
}

function isAllowedOrigin(origin: string | undefined) {
  const cleaned = cleanOrigin(origin);
  if (!cleaned) return false;
  return allowedOrigins.includes(cleaned) || allowedOrigins.some((allowed) => allowed.endsWith("*") && cleaned.startsWith(allowed.slice(0, -1)));
}

function getClientIp(c: any) {
  const forwarded = c.req.header("x-forwarded-for") ?? c.req.header("cf-connecting-ip") ?? c.req.header("x-real-ip") ?? "";
  const primary = forwarded.split(",")[0]?.trim();
  return primary || "unknown";
}

function applyRateLimit(c: any) {
  const ip = getClientIp(c);
  const now = Date.now();
  const windowValues = clientRequestTimestamps.get(ip) ?? [];
  const recent = windowValues.filter((timestamp) => now - timestamp < rateLimitWindowMs);
  if (recent.length >= rateLimitMaxRequests) {
    clientRequestTimestamps.set(ip, recent);
    return false;
  }
  recent.push(now);
  clientRequestTimestamps.set(ip, recent);
  return true;
}

// Enable logger
app.use('*', logger(console.log));

app.use('*', async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  c.header("Cross-Origin-Opener-Policy", "same-origin");
  c.header("Cross-Origin-Resource-Policy", "same-origin");
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  const pathname = new URL(c.req.url).pathname;
  const routeIsRateLimited = pathname.includes("/analytics/events") || pathname.includes("/orders") || pathname.includes("/admin/upload") || pathname.includes("/admin/login");
  if (routeIsRateLimited && !applyRateLimit(c)) {
    return c.json({ error: "Too many requests. Please try again in a minute." }, 429);
  }

  await next();
});

// Enable CORS for browser requests from trusted origins only
app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) return "null";
      return isAllowedOrigin(origin) ? origin : "null";
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get(`${prefix}/health`, (c) => {
  return c.json({ status: "ok" });
});

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

function normalizedSizes(value: unknown): string[] {
  const entries = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const sizes = entries
    .filter((size): size is string => typeof size === "string")
    .flatMap((size) => size.split(",").map((part) => part.trim()).filter(Boolean))
    .flatMap((size) => /^\d+(?:\s+\d+)+$/.test(size) ? size.split(/\s+/) : [size]);
  return sizes.length ? [...new Set(sizes)] : ["One size"];
}

async function ensureCatalog() {
  return kv.getByPrefix("product:");
}

async function ensureCategories() {
  const existing = await kv.getByPrefix("category:");
  if (existing.length) return existing;
  const catalog = await ensureCatalog();
  const names = [...new Set(catalog.map((product) => product.category).filter(Boolean))];
  const categories = names.map((name) => ({
    slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name,
  }));
  await kv.mset(categories.map(({ slug }) => `category:${slug}`), categories);
  return categories;
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return null;

  const client = createClient(supabaseUrl, anonKey);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  if (!data.user.email_confirmed_at) return null;

  const adminEmails = normalizeAdminEmails(Deno.env.get("ADMIN_EMAILS") ?? "");
  return isAdminUser(data.user, adminEmails) ? data.user : null;
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

app.get(`${prefix}/site-content`, async (c) => {
  try {
    return c.json(await kv.get("site-content:media") ?? []);
  } catch (error) {
    console.log("Site content load error", error);
    return c.json({ error: "Unable to load site content" }, 500);
  }
});

app.get(`${prefix}/story-content`, async (c) => {
  try {
    return c.json(await kv.get("site-content:story") ?? null);
  } catch (error) {
    console.log("Story content load error", error);
    return c.json({ error: "Unable to load story content" }, 500);
  }
});

app.post(`${prefix}/analytics/events`, async (c) => {
  try {
    const input = await c.req.json();
    const allowedEvents = ["page_view", "click", "product_view", "add_to_cart", "checkout_start"];
    const visitorId = typeof input.visitorId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.visitorId)
      ? input.visitorId
      : null;
    const path = typeof input.path === "string" ? input.path.split(/[?#]/, 1)[0].slice(0, 200) : "";
    if (!visitorId || !allowedEvents.includes(input.event) || !path.startsWith("/") || path.startsWith("/admin")) {
      return c.json({ error: "Invalid analytics event" }, 400);
    }

    const database = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await database.from("store_analytics_events").insert({
      visitor_id: visitorId,
      event_type: input.event,
      path,
      target: typeof input.target === "string" ? input.target.replace(/[\r\n]/g, " ").slice(0, 160) : null,
      product_slug: typeof input.productSlug === "string" ? input.productSlug.slice(0, 120) : null,
    });
    if (error) throw error;
    return c.json({ recorded: true }, 201);
  } catch (error) {
    console.log("Analytics event error", error);
    return c.json({ error: "Unable to record analytics" }, 500);
  }
});

app.post(`${prefix}/orders`, async (c) => {
  let stage = "read request";
  try {
    const input = await c.req.json();
    stage = "validate order";
    if (!Array.isArray(input.items) || !input.items.length || input.items.some((item: any) =>
      !item || typeof item.slug !== "string" || typeof item.name !== "string" ||
      !Number.isSafeInteger(item.quantity) || item.quantity < 1 || typeof item.size !== "string"
    )) {
      return c.json({ error: "An order requires valid items" }, 400);
    }
    const customer = input.customer;
    if (!customer || typeof customer.name !== "string" || !customer.name.trim() ||
      typeof customer.phone !== "string" || !customer.phone.trim() ||
      typeof customer.fulfillment !== "string"
    ) return c.json({ error: "Name, phone, and fulfillment are required" }, 400);

    const name = customer.name.trim();
    const phone = customer.phone.trim();
    const fulfillment = customer.fulfillment.trim();
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,80}$/.test(name)) {
      return c.json({ error: "Name format is invalid" }, 400);
    }
    if (!/^\+?[0-9\s()\-]{8,20}$/.test(phone)) {
      return c.json({ error: "Phone number format is invalid" }, 400);
    }
    if (!/^(pickup|delivery)$/i.test(fulfillment)) {
      return c.json({ error: "Fulfillment method is invalid" }, 400);
    }

    const items = [];
    let totalValue = 0;
    for (const item of input.items) {
      stage = "load product";
      const product = await kv.get(`product:${item.slug}`);
      if (!product || product.published === false) {
        return c.json({ error: `Product ${item.slug} is no longer available` }, 400);
      }
      const unitPrice = Number(String(product.price).replace(/[^\d]/g, ""));
      if (!Number.isSafeInteger(unitPrice) || unitPrice <= 0) {
        return c.json({ error: `Product ${item.slug} has an invalid price` }, 400);
      }
      const availableSizes = normalizedSizes(product.sizes);
      if (!availableSizes.includes(item.size)) {
        return c.json({ error: `Size ${item.size} is not available for ${product.name}` }, 400);
      }
      const lineTotal = unitPrice * item.quantity;
      if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(totalValue + lineTotal)) {
        return c.json({ error: "Order total is outside the supported range" }, 400);
      }
      totalValue += lineTotal;
      items.push({
        slug: product.slug,
        name: product.name,
        quantity: item.quantity,
        size: item.size,
        price: product.price,
        image: product.image,
      });
    }

    const id = crypto.randomUUID();
    stage = "save order";
    const order = {
      id,
      items,
      total: `${new Intl.NumberFormat("en-US").format(totalValue)} BIF`,
      customer: {
        name,
        phone,
        fulfillment: fulfillment.toLowerCase() === "pickup" ? "Pickup" : "Delivery",
        area: typeof customer.area === "string" ? customer.area.trim().slice(0, 120) : "",
        note: typeof customer.note === "string" ? customer.note.trim().slice(0, 500) : "",
      },
      status: "new",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`order:${id}`, order);
    return c.json(order, 201);
  } catch (error) {
    console.log("Order create error at", stage, error);
    return c.json({ error: "Unable to create order" }, 500);
  }
});

app.get(`${prefix}/admin/products`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  return c.json(await ensureCatalog());
});

app.get(`${prefix}/admin/categories`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  try {
    return c.json(await ensureCategories());
  } catch (error) {
    console.log("Category load error", error);
    return c.json({ error: "Unable to load categories" }, 500);
  }
});

app.get(`${prefix}/admin/site-content`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  try {
    return c.json(await kv.get("site-content:media") ?? []);
  } catch (error) {
    console.log("Admin site content load error", error);
    return c.json({ error: "Unable to load site content" }, 500);
  }
});

app.put(`${prefix}/admin/site-content`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  try {
    const input = await c.req.json();
    if (!Array.isArray(input.items) || input.items.length > 100 || input.items.some((item: any) =>
      !item || typeof item.id !== "string" || typeof item.section !== "string" ||
      typeof item.image !== "string" || !item.image.trim() ||
      !["hero", "audience-women", "audience-men", "feature-main", "feature-secondary", "campaign"].includes(item.section)
    )) return c.json({ error: "A valid list of site media items is required" }, 400);
    await kv.set("site-content:media", input.items);
    return c.json(input.items);
  } catch (error) {
    console.log("Admin site content save error", error);
    return c.json({ error: "Unable to save site content" }, 500);
  }
});

app.get(`${prefix}/admin/story-content`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  try {
    return c.json(await kv.get("site-content:story") ?? null);
  } catch (error) {
    console.log("Admin story content load error", error);
    return c.json({ error: "Unable to load story content" }, 500);
  }
});

app.put(`${prefix}/admin/story-content`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  try {
    const content = await c.req.json();
    const requiredFields = ["eyebrow", "title", "intro", "image", "secondaryTitle", "secondaryCopy", "secondaryCopyTwo", "valuesTitle", "futureTitle", "futureCopy"];
    if (!content || requiredFields.some((field) => typeof content[field] !== "string")) {
      return c.json({ error: "Complete story content is required" }, 400);
    }
    await kv.set("site-content:story", content);
    return c.json(content);
  } catch (error) {
    console.log("Admin story content save error", error);
    return c.json({ error: "Unable to save story content" }, 500);
  }
});

app.get(`${prefix}/admin/insights`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  try {
    const requestedDays = Number(c.req.query("days") ?? 30);
    const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - days + 1);

    const database = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: events, error: eventError }, storedOrders] = await Promise.all([
      database.from("store_analytics_events")
        .select("visitor_id,event_type,path,product_slug,created_at")
        .gte("created_at", start.toISOString())
        .order("created_at", { ascending: false })
        .limit(20000),
      kv.getByPrefix("order:"),
    ]);
    if (eventError) throw eventError;

    const includedOrders = storedOrders
      .filter((order) => order.createdAt && new Date(order.createdAt) >= start && order.status !== "cancelled")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pageEvents = (events ?? []).filter((event) => event.event_type === "page_view");
    const uniqueVisitors = new Set(pageEvents.map((event) => event.visitor_id)).size;
    const pageCounts = new Map<string, number>();
    const productViews = new Map<string, number>();
    const productAdds = new Map<string, number>();
    for (const event of events ?? []) {
      if (event.event_type === "page_view") pageCounts.set(event.path, (pageCounts.get(event.path) ?? 0) + 1);
      if (event.product_slug && event.event_type === "product_view") {
        productViews.set(event.product_slug, (productViews.get(event.product_slug) ?? 0) + 1);
      }
      if (event.product_slug && event.event_type === "add_to_cart") {
        productAdds.set(event.product_slug, (productAdds.get(event.product_slug) ?? 0) + 1);
      }
    }

    const daily = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { date: key, visits: 0, orders: 0 };
    });
    const dailyByDate = new Map(daily.map((day) => [day.date, day]));
    for (const event of pageEvents) {
      const day = dailyByDate.get(String(event.created_at).slice(0, 10));
      if (day) day.visits += 1;
    }
    for (const order of includedOrders) {
      const day = dailyByDate.get(String(order.createdAt).slice(0, 10));
      if (day) day.orders += 1;
    }

    const orderValue = includedOrders.reduce((sum, order) => sum + Number(String(order.total).replace(/[^\d]/g, "")), 0);
    const visits = pageEvents.length;
    return c.json({
      periodDays: days,
      visits,
      uniqueVisitors,
      clicks: (events ?? []).filter((event) => event.event_type === "click").length,
      productViews: (events ?? []).filter((event) => event.event_type === "product_view").length,
      addToCart: (events ?? []).filter((event) => event.event_type === "add_to_cart").length,
      checkoutStarts: (events ?? []).filter((event) => event.event_type === "checkout_start").length,
      orders: includedOrders.length,
      orderValue,
      averageOrderValue: includedOrders.length ? Math.round(orderValue / includedOrders.length) : 0,
      conversionRate: visits ? (includedOrders.length / visits) * 100 : 0,
      daily,
      topPages: [...pageCounts].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 6),
      topProducts: [...new Set([...productViews.keys(), ...productAdds.keys()])]
        .map((slug) => ({ slug, views: productViews.get(slug) ?? 0, adds: productAdds.get(slug) ?? 0 }))
        .sort((a, b) => b.views + b.adds - a.views - a.adds).slice(0, 6),
      recentOrders: includedOrders.slice(0, 8),
    });
  } catch (error) {
    console.log("Admin insights error", error);
    return c.json({ error: "Unable to load store insights" }, 500);
  }
});

app.post(`${prefix}/admin/categories`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  const input = await c.req.json();
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!name || !slug) return c.json({ error: "A valid category name is required" }, 400);
  const categories = await ensureCategories();
  if (categories.some((category) => category.slug === slug || category.name.toLowerCase() === name.toLowerCase())) {
    return c.json({ error: "That category already exists" }, 409);
  }
  const category = { slug, name };
  await kv.set(`category:${slug}`, category);
  return c.json(category, 201);
});

app.delete(`${prefix}/admin/categories/:slug`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  const slug = c.req.param("slug");
  const category = await kv.get(`category:${slug}`);
  if (!category) return c.json({ error: "Category not found" }, 404);
  const products = await kv.getByPrefix("product:");
  if (products.some((product) => product.category === category.name)) {
    return c.json({ error: "Move or delete products in this category before removing it" }, 409);
  }
  await kv.del(`category:${slug}`);
  return c.json({ success: true });
});

app.post(`${prefix}/admin/products`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  const product = await c.req.json();
  if (typeof product.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) ||
    typeof product.name !== "string" || !product.name.trim() ||
    typeof product.category !== "string" || !product.category.trim() ||
    typeof product.price !== "string" || !product.price.trim()
  ) {
    return c.json({ error: "A valid slug, name, category, and price are required" }, 400);
  }
  if (await kv.get(`product:${product.slug}`)) return c.json({ error: "A product with this slug already exists" }, 409);
  product.sizes = normalizedSizes(product.sizes);
  await kv.set(`product:${product.slug}`, product);
  return c.json(product, 201);
});

app.put(`${prefix}/admin/products/:slug`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  const product = await c.req.json();
  const oldSlug = c.req.param("slug");
  if (typeof product.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) ||
    typeof product.name !== "string" || !product.name.trim() ||
    typeof product.category !== "string" || !product.category.trim() ||
    typeof product.price !== "string" || !product.price.trim()
  ) {
    return c.json({ error: "A valid slug, name, category, and price are required" }, 400);
  }
  const existing = await kv.get(`product:${oldSlug}`);
  if (!existing) return c.json({ error: "Product not found" }, 404);
  if (oldSlug !== product.slug && await kv.get(`product:${product.slug}`)) {
    return c.json({ error: "A product with this slug already exists" }, 409);
  }
  product.sizes = normalizedSizes(product.sizes);
  await kv.set(`product:${product.slug}`, product);
  if (oldSlug !== product.slug) await kv.del(`product:${oldSlug}`);
  return c.json(product);
});

app.delete(`${prefix}/admin/products/:slug`, async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: "Authentication required" }, 401);
  const key = `product:${c.req.param("slug")}`;
  if (!await kv.get(key)) return c.json({ error: "Product not found" }, 404);
  await kv.del(key);
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
  const allowedStatuses = ["new", "confirmed", "making", "ready", "completed", "cancelled"];
  if (typeof update.status !== "string" || !allowedStatuses.includes(update.status)) {
    return c.json({ error: "A valid order status is required" }, 400);
  }
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

app.notFound((c) => c.json({ error: "Not found" }, 404));

Deno.serve(app.fetch);
