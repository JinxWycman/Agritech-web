"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f4efe4", color: "#1c1917", fontFamily: "Georgia, serif" }}>
        <main style={{ maxWidth: 32 * 16, margin: "0 auto", padding: "4rem 1.5rem" }}>
          <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", fontSize: 11, color: "#8C6A45" }}>
            Agritech AI
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 400 }}>The console hit an unexpected error</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, lineHeight: 1.6 }}>
            {error.message || "Reload the page to continue."}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              background: "#16382A",
              color: "#FBF8F2",
              border: 0,
              borderRadius: 12,
              padding: "10px 16px",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
