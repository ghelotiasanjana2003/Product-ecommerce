"use client";

import ProductCard from "@/Components/ProductCard";
import { useEffect, useState } from "react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [category, setCategory] = useState("All");
  const categories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);

        const response = await fetch("https://fakestoreapi.com/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products.");
        }

        const data = await response.json();

        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <main className="container">
        <div className="loader"></div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container">
        <h2>{error}</h2>
      </main>
    );
  }
  const filteredProducts = [...products]
    // Search
    .filter((product) =>
      product.title.toLowerCase().includes(search.toLowerCase())
    )

    // Category
    .filter((product) =>
      category === "All"
        ? true
        : product.category === category
    )

    // Sort
    .sort((a, b) => {
      if (sort === "low") {
        return a.price - b.price;
      }

      if (sort === "high") {
        return b.price - a.price;
      }

      return 0;
    });
  return (
    <main className="container">
      <div className="hero">
        <h1>🛍️ Products List</h1>
        <p>Discover amazing products at the best prices.</p>
      </div>
    <div className="filter-card">
  <div className="filters">

    <input
      type="text"
      placeholder="🔍 Search products..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

    <select
      value={sort}
      onChange={(e) => setSort(e.target.value)}
    >
      <option value="">Sort By Price</option>
      <option value="low">Low → High</option>
      <option value="high">High → Low</option>
    </select>

    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
    >
      {categories.map((cat) => (
        <option key={cat}>{cat}</option>
      ))}
    </select>

  </div>
</div>
      <div className="products">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))
        ) : (
          <h2>No products found.</h2>
        )}
      </div>
    </main>
  );
}