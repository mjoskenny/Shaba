import type { Product } from "../data";
import type { SiteMediaItem, StoryContent } from "./site-content";
import { apiBase, assertSupabaseConfigured, supabase, supabaseAnonKey } from "./supabase";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  assertSupabaseConfigured();
  const { data } = await supabase.auth.getSession();
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token ?? supabaseAnonKey}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const status = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
    throw new Error(body?.error ?? body?.message ?? `Request failed (${status})`);
  }
  return response.json();
}

export async function getProducts() {
  try {
    return await request<Product[]>("/products");
  } catch {
    return [];
  }
}

export async function getProduct(slug: string) {
  try {
    return await request<Product>(`/products/${slug}`);
  } catch {
    return null;
  }
}

export const adminApi = {
  siteMedia: () => request<SiteMediaItem[]>("/admin/site-content"),
  saveSiteMedia: (items: SiteMediaItem[]) => request<SiteMediaItem[]>("/admin/site-content", {
    method: "PUT",
    body: JSON.stringify({ items }),
  }),
  storyContent: () => request<StoryContent | null>("/admin/story-content"),
  saveStoryContent: (content: StoryContent) => request<StoryContent>("/admin/story-content", {
    method: "PUT",
    body: JSON.stringify(content),
  }),
  products: () => request<Product[]>("/admin/products"),
  insights: (days: 7 | 30 | 90) => request<StoreInsights>(`/admin/insights?days=${days}`),
  categories: () => request<CategoryRecord[]>("/admin/categories"),
  saveCategory: (name: string) => request<CategoryRecord>("/admin/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  }),
  deleteCategory: (slug: string) => request<{ success: boolean }>(`/admin/categories/${encodeURIComponent(slug)}`, { method: "DELETE" }),
  orders: () => request<OrderRecord[]>("/admin/orders"),
  saveProduct: (product: Product, originalSlug?: string) =>
    request<Product>(originalSlug ? `/admin/products/${encodeURIComponent(originalSlug)}` : "/admin/products", {
      method: originalSlug ? "PUT" : "POST",
      body: JSON.stringify(product),
    }),
  deleteProduct: (slug: string) => request<{ success: boolean }>(`/admin/products/${encodeURIComponent(slug)}`, { method: "DELETE" }),
  updateOrder: (id: string, status: string) =>
    request<OrderRecord>(`/admin/orders/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
  uploadImage: async (file: File) => {
    assertSupabaseConfigured();
    const { data } = await supabase.auth.getSession();
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${apiBase}/admin/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.session?.access_token ?? supabaseAnonKey}`,
      },
      body: form,
    });
    const body = await response.json().catch(() => ({ error: "Upload failed" }));
    if (!response.ok) throw new Error(body.error ?? body.message ?? "Upload failed");
    return body as { url: string };
  },
};

export const storeContentApi = {
  siteMedia: () => request<SiteMediaItem[]>("/site-content"),
  storyContent: () => request<StoryContent | null>("/story-content"),
};

export type StoreInsights = {
  periodDays: number;
  visits: number;
  uniqueVisitors: number;
  clicks: number;
  productViews: number;
  addToCart: number;
  checkoutStarts: number;
  orders: number;
  orderValue: number;
  averageOrderValue: number;
  conversionRate: number;
  daily: Array<{ date: string; visits: number; orders: number }>;
  topPages: Array<{ path: string; views: number }>;
  topProducts: Array<{ slug: string; views: number; adds: number }>;
  recentOrders: OrderRecord[];
};

export type CategoryRecord = {
  slug: string;
  name: string;
};

export type OrderCustomer = {
  name: string;
  phone: string;
  fulfillment: string;
  area: string;
  note: string;
};

export const createOrder = (
  items: Array<{ slug: string; name: string; quantity: number; size: string; price: string; image: string }>,
  total: string,
  customer: OrderCustomer,
  signal?: AbortSignal,
) =>
  request<OrderRecord>("/orders", {
    method: "POST",
    signal,
    body: JSON.stringify({ items, total, customer }),
  });

export type OrderRecord = {
  id: string;
  items: Array<{ slug?: string; name: string; quantity: number; size?: string; price?: string; image?: string }>;
  total: string;
  status: string;
  createdAt: string;
  customer?: OrderCustomer;
};
