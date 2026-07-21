import Link from "next/link";

async function getProduct(id) {
  const res = await fetch(`https://fakestoreapi.com/products/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch product");
  }

  return res.json();
}

export default async function ProductDetails({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <main className="detail-container">
      <Link href="/" className="back-btn">
        ← Back to Products
      </Link>

      <div className="detail-card">
        <div className="detail-image">
          <img
            src={product.image}
            alt={product.title}
          />
        </div>

        <div className="detail-content">
          <span className="category">{product.category}</span>

          <h1>{product.title}</h1>

          <div className="rating">
            ⭐ {product.rating.rate} ({product.rating.count} reviews)
          </div>

          <h2>${product.price}</h2>

          <p>{product.description}</p>
        </div>
      </div>
    </main>
  );
}