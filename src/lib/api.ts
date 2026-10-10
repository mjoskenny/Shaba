import type { Product } from "../data";
import { products as fallbackProducts } from "../data";
import { apiBase, supabase } from "./supabase";
import { fallbackJournals, type JournalEntry } from "../journals";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error ?? "Request failed");
  }
  return response.json();
}

export async function getProducts() {
  try {
    return await request<Product[]>("/products");
  } catch {
    return fallbackProducts;
  }
}

export async function getProduct(slug: string) {
  try {
    return await request<Product>(`/products/${slug}`);
  } catch {
    return fallbackProducts.find((product) => product.slug === slug) ?? null;
  }
}

export async function getJournals() {
  try {
    return await request<JournalEntry[]>("/journals");
  } catch {
    return fallbackJournals;
  }
}

export async function getJournal(slug: string) {
  try {
    return await request<JournalEntry>(`/journals/${slug}`);
  } catch {
    return fallbackJournals.find((journal) => journal.slug === slug) ?? null;
  }
}

export const adminApi = {
  products: () => request<Product[]>("/admin/products"),
  orders: () => request<OrderRecord[]>("/admin/orders"),
  journals: () => request<JournalEntry[]>("/admin/journals"),
  saveProduct: (product: Product, originalSlug?: string) =>
    request<Product>(originalSlug ? `/admin/products/${originalSlug}` : "/admin/products", {
      method: originalSlug ? "PUT" : "POST",
      body: JSON.stringify(product),
    }),
  deleteProduct: (slug: string) => request<{ success: boolean }>(`/admin/products/${slug}`, { method: "DELETE" }),
  updateOrder: (id: string, status: string) =>
    request<OrderRecord>(`/admin/orders/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
  saveJournal: (journal: JournalEntry, originalSlug?: string) =>
    request<JournalEntry>(originalSlug ? `/admin/journals/${originalSlug}` : "/admin/journals", {
      method: originalSlug ? "PUT" : "POST",
      body: JSON.stringify(journal),
    }),
  deleteJournal: (slug: string) => request<{ success: boolean }>(`/admin/journals/${slug}`, { method: "DELETE" }),
  uploadImage: async (file: File) => {
    const { data } = await supabase.auth.getSession();
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${apiBase}/admin/upload`, {
      method: "POST",
      headers: data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {},
      body: form,
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Upload failed");
    return body as { url: string };
  },
};

export const createOrder = (items: Array<{ slug: string; name: string; quantity: number; size: string }>, total: string) =>
  request<OrderRecord>("/orders", {
    method: "POST",
    body: JSON.stringify({ items, total }),
  });

export type OrderRecord = {
  id: string;
  items: Array<{ name: string; quantity: number; size?: string }>;
  total: string;
  status: string;
  createdAt: string;
};
