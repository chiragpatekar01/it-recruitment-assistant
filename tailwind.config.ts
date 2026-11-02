import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        page: v("page"), bg: v("bg"), surface: v("surface"), surface2: v("surface-2"), side: v("side"),
        ink: v("ink"), muted: v("muted"), line: v("line"), line2: v("line-2"),
        accent: v("accent"), "accent-ink": v("accent-ink"), "accent-soft": v("accent-soft"),
        good: v("good"), "good-soft": v("good-soft"), warn: v("warn"), "warn-soft": v("warn-soft"),
        bad: v("bad"), "bad-soft": v("bad-soft"), info: v("info"), "info-soft": v("info-soft"),
        violet: v("violet"), "violet-soft": v("violet-soft"), teal: v("teal"), "teal-soft": v("teal-soft"), grey: v("grey-soft"),
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Segoe UI"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
