import Link from "next/link";

export default function ProductCard({ product }) {
  return (
    <div className="card">

      <div className="image-box">
        <img
          src={product.image}
          alt={product.title}
        />
      </div>

      <div className="card-body">

        <span className="badge">
          {product.category}
        </span>

        <h3>{product.title}</h3>

        <div className="price-rating">

          <span className="price">
            ${product.price}
          </span>

          <span className="rating">
            ⭐ {product.rating.rate}
          </span>

        </div>

        <Link
          href={`/product/${product.id}`}
          className="details-btn"
        >
          View Details →
        </Link>

      </div>

    </div>
  );
}