import { useEffect, useState } from "react";
import type { Product } from "../data";
import { products as fallbackProducts } from "../data";
import { getProducts } from "../lib/api";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getProducts().then((items) => {
      if (active) {
        setProducts(items);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { products, loading };
}
