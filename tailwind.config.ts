import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        forest: {
          50: "#EEF6F1",
          100: "#D7EBDD",
          200: "#B4D6C0",
          300: "#7FB396",
          400: "#4C8F6E",
          500: "#2F6F52",
          600: "#245A42",
          700: "#1C4735",
          800: "#16382A",
          900: "#10281E",
          950: "#0B1C15",
        },
        cream: {
          50: "#FBF8F2",
          100: "#F4EFE4",
          200: "#E8DFCC",
        },
        soil: {
          400: "#C4A574",
          500: "#A9845B",
          600: "#8C6A45",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-instrument)", "Georgia", "serif"],
        mono: ["ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16, 40, 30, 0.04), 0 12px 32px rgba(16, 40, 30, 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
