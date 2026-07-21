"use client";

export default function Error({
  error,
  reset,
}) {
  return (
    <div className="container">
      <h2>Something went wrong!</h2>

      <p>{error.message}</p>

      <button onClick={() => reset()}>
        Try Again
      </button>
    </div>
  );
}