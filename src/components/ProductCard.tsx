import { Link } from "react-router";
import type { Product } from "../data";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card group">
      <Link aria-label={`View ${product.name}`} to={`/products/${product.slug}`}>
        <div className="product-media relative aspect-square overflow-hidden">
          <img alt={product.name} className="size-full object-cover" src={product.image} />
        </div>
      </Link>
      <div className="product-info text-forest">
        <Link to={`/products/${product.slug}`}>
          <h3 className="w-full font-serif text-xl">{product.name}</h3>
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-semibold">{product.price}</p>
          <Link aria-label={`View ${product.name}`} className="product-arrow" to={`/products/${product.slug}`}>
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
