import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#14213D",
          dark: "#0D1730",
          light: "#1E2D52",
        },
        coral: {
          DEFAULT: "#FF6B4A",
          dark: "#E5512F",
          light: "#FFE4DC",
        },
        canvas: "#F7F8FA",
        ink: {
          DEFAULT: "#1A1D29",
          muted: "#6B7280",
          faint: "#9CA3AF",
        },
        status: {
          attente: "#94A3B8",
          entretien: "#2563EB",
          relance: "#F59E0B",
          refuse: "#EF4444",
          accepte: "#16A34A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 33, 61, 0.06), 0 1px 8px rgba(20, 33, 61, 0.06)",
        "card-hover": "0 4px 16px rgba(20, 33, 61, 0.10)",
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
