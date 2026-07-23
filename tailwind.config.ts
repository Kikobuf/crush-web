import type { Config } from "tailwindcss";

// Palette: Crush is Charm's "glamourous" terminal agent (💘 branding).
// Rather than default dark-mode green-on-black terminal cliché, or
// Claude's warm terracotta, we lean into that: a near-black stage with
// a single hot-pink/magenta "glam" accent, plus a muted gold for
// secondary emphasis (tool calls / cost), so the page reads as
// "Crush" specifically rather than "generic AI chat, dark mode."
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stage: {
          950: "#0b0b0e",
          900: "#121216",
          800: "#1a1a20",
          700: "#25252d",
          600: "#34343f",
        },
        ink: {
          100: "#f3f1ee",
          300: "#cfcbc6",
          500: "#8f8b88",
        },
        glam: {
          DEFAULT: "#ff4fa3",
          soft: "#ff8ac2",
          dim: "#7a2650",
        },
        gilt: {
          DEFAULT: "#e8b559",
          dim: "#6b5527",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        pulseheart: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.35)", opacity: "0.75" },
        },
      },
      animation: {
        pulseheart: "pulseheart 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
