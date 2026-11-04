import { apiBase, isSupabaseConfigured, supabase, supabaseAnonKey } from "./supabase";

export type StoreAnalyticsEvent = "page_view" | "click" | "product_view" | "add_to_cart" | "checkout_start";

const visitorStorageKey = "shaba-visitor-id";

function getVisitorId() {
  try {
    let visitorId = localStorage.getItem(visitorStorageKey);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(visitorStorageKey, visitorId);
    }
    return visitorId;
  } catch {
    return crypto.randomUUID();
  }
}

export async function trackStoreEvent(
  event: StoreAnalyticsEvent,
  details: { path?: string; target?: string; productSlug?: string } = {},
) {
  if (!isSupabaseConfigured) return;

  try {
    const { data } = await supabase.auth.getSession();
    await fetch(`${apiBase}/analytics/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session?.access_token ?? supabaseAnonKey}`,
      },
      body: JSON.stringify({
        event,
        visitorId: getVisitorId(),
        path: details.path ?? window.location.pathname,
        target: details.target,
        productSlug: details.productSlug,
      }),
      keepalive: true,
    });
  } catch {
    // Analytics are best-effort and must never block browsing or checkout.
  }
}

export function getAnalyticsVisitorId() {
  return getVisitorId();
}
