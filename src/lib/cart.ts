import type { Product } from "../data";

export type CartItem = {
  product: Product;
  quantity: number;
  size: string;
};

const key = "shaba-cart";

export function getCart(): CartItem[] {
  try {
    const cart = JSON.parse(localStorage.getItem(key) ?? "[]") as CartItem[];
    return cart.map((item) => ({ ...item, size: item.size || item.product.sizes?.[0] || "One size" }));
  } catch {
    return [];
  }
}

export function addCartItem(product: Product, size: string) {
  const cart = getCart();
  const existing = cart.find((item) => item.product.slug === product.slug && item.size === size);
  if (existing) existing.quantity += 1;
  else cart.push({ product, quantity: 1, size });
  localStorage.setItem(key, JSON.stringify(cart));
  window.dispatchEvent(new Event("shaba-cart-change"));
}

export function updateCartItem(slug: string, size: string, quantity: number) {
  const cart = getCart();
  const item = cart.find((entry) => entry.product.slug === slug && entry.size === size);
  if (!item) return;
  if (quantity <= 0) {
    removeCartItem(slug, size);
    return;
  }
  item.quantity = quantity;
  localStorage.setItem(key, JSON.stringify(cart));
  window.dispatchEvent(new Event("shaba-cart-change"));
}

export function removeCartItem(slug: string, size: string) {
  const cart = getCart().filter((item) => !(item.product.slug === slug && item.size === size));
  localStorage.setItem(key, JSON.stringify(cart));
  window.dispatchEvent(new Event("shaba-cart-change"));
}

export function clearCart() {
  localStorage.removeItem(key);
  window.dispatchEvent(new Event("shaba-cart-change"));
}

export function getCartCount() {
  return getCart().reduce((total, item) => total + item.quantity, 0);
}
