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
        sans: ['Inter', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-500%) skewX(-20deg)' },
          '100%': { transform: 'translateX(500%) skewX(-20deg)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite linear',
        'fade-in': 'fade-in 0.4s ease-out both',
      },
      boxShadow: {
        'elevated': '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
        'elevated-lg': '0 4px 24px rgba(0,0,0,0.12)',
        'blue-glow': '0 4px 16px rgba(29,78,216,0.25)',
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        ink2: "var(--ink2)",
        muted: "var(--muted)",
        line: "var(--line)",
        cobalt: "var(--cobalt)",
        "cobalt-light": "var(--cobalt-light)",
        "industrial-orange": "var(--industrial-orange)",
        "industrial-orange-bg": "var(--industrial-orange-bg)",
        "neon-green": "var(--neon-green)",
        "neon-green-bg": "var(--neon-green-bg)",
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
        "ec-navy": "var(--ec-navy)",
        "ec-blue": "var(--ec-blue)",
        "ec-cyan": "var(--ec-cyan)",
      },
    },
  },
  plugins: [],
};
export default config;
