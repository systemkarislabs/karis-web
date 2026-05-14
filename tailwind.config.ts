import type { Config } from "tailwindcss";

export default {
  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./app.vue",
    "./error.vue",
  ],
  darkMode: ["[data-theme=\"dark\"]"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Poppins", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      colors: {
        primary: { DEFAULT: "var(--color-primary)", fg: "var(--color-primary-fg)", hover: "var(--color-primary-hover)", 50: "var(--color-primary-50)" },
        success: { DEFAULT: "var(--color-success)", 50: "var(--color-success-50)" },
        warning: { DEFAULT: "var(--color-warning)", 50: "var(--color-warning-50)" },
        destructive: { DEFAULT: "var(--color-destructive)", 50: "var(--color-destructive-50)" },
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
    },
  },
  plugins: [],
} satisfies Config;
