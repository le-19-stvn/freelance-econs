import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-500%) skewX(-20deg)' },
          '100%': { transform: 'translateX(500%) skewX(-20deg)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite linear',
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        ink2: "var(--ink2)",
        muted: "var(--muted)",
        line: "var(--line)",
        "blue-primary": "var(--blue-primary)",
        "blue-mid": "var(--blue-mid)",
        "blue-surface": "var(--blue-surface)",
        cyan: "var(--cyan)",
        success: "var(--success)",
        "success-bg": "var(--success-bg)",
        warning: "var(--warning)",
        "warning-bg": "var(--warning-bg)",
        danger: "var(--danger)",
        "danger-bg": "var(--danger-bg)",
      },
    },
  },
  plugins: [],
};
export default config;
