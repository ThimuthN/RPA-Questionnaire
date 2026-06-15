"use client";

// Root-level error boundary. It replaces the root layout (and its globals.css),
// so styles are inlined and self-contained — no CSS variables available here.
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07131f",
          color: "#f3f7fb",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "24px"
        }}
      >
        <div style={{ maxWidth: 460, textAlign: "center" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#18b5ae", fontWeight: 600 }}>
            Northstar
          </p>
          <h1 style={{ marginTop: 12, fontSize: 26, fontWeight: 600 }}>Something went wrong.</h1>
          <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, color: "#8aa0b6" }}>
            An unexpected error interrupted this page. You can try again, or head back and continue.
          </p>
          {error?.digest ? (
            <p style={{ marginTop: 8, fontSize: 11, color: "#5a7a8e" }}>Reference: {error.digest}</p>
          ) : null}
          <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => reset()}
              style={{
                cursor: "pointer",
                borderRadius: 999,
                border: "none",
                background: "#18b5ae",
                color: "#04221f",
                fontWeight: 600,
                fontSize: 14,
                padding: "10px 20px"
              }}
            >
              Try again
            </button>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              style={{
                cursor: "pointer",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "transparent",
                color: "#f3f7fb",
                fontSize: 14,
                padding: "10px 20px"
              }}
            >
              Back to home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
