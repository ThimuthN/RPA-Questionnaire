import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050b16"
        },
        navy: {
          900: "#0a1830",
          800: "#102749"
        },
        brand: {
          600: "#1f6fff",
          500: "#2f86ff",
          300: "#8ab8ff"
        }
      },
      borderRadius: {
        sm: "10px",
        md: "14px",
        lg: "20px"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(8, 23, 51, 0.12)",
        strong: "0 18px 50px rgba(6, 18, 39, 0.28)"
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
