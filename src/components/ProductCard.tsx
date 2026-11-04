import { Link } from "react-router";
import type { Product } from "../data";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card group">
      <Link aria-label={`View ${product.name}`} className="product-media relative block aspect-[4/5] overflow-hidden" to={`/products/${product.slug}`}>
        <img alt={product.name} className="size-full object-cover" src={product.image} />
        <span className="product-category">{product.category}</span>
        <span aria-hidden="true" className="product-media-arrow">
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </span>
      </Link>
      <div className="product-info grid justify-items-center text-center text-forest">
        <Link className="block min-w-0" to={`/products/${product.slug}`}>
          <h3 className="product-card-name text-sm font-semibold tracking-[-0.03em] sm:text-base">{product.name}</h3>
          <span className="product-card-category">{product.category}</span>
        </Link>
        <p className="product-card-price mt-1">{product.price}</p>
      </div>
    </article>
  );
}
