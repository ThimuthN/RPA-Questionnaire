import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#050b16" },
        navy: { 900: "#0a1830", 800: "#102749" },
        brand: { 600: "#1f6fff", 500: "#2f86ff", 300: "#8ab8ff" },
      },
      borderRadius: {
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
      },
      spacing: {
        "spacing-xs": "8px",
        "spacing-sm": "12px",
        "spacing-md": "16px",
        "spacing-lg": "20px",
        "spacing-xl": "24px",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(8, 23, 51, 0.12)",
        strong: "0 18px 50px rgba(6, 18, 39, 0.28)",
      },
      fontSize: {
        "heading-1": ["2.5rem", { lineHeight: "1.1" }],
        "heading-2": ["2rem", { lineHeight: "1.2" }],
        "heading-3": ["1.5rem", { lineHeight: "1.3" }],
        "heading-4": ["1.25rem", { lineHeight: "1.4" }],
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
