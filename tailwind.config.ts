import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#090d16", // Deep civic ink navy
        surface: {
          50: "#131b2e",
          100: "#17223b",
          200: "#1e2c4c",
          300: "#273961",
        },
        civic: {
          teal: "#06b6d4",
          cyan: "#22d3ee",
          indigo: "#6366f1",
          violet: "#8b5cf6",
        },
        severity: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#f59e0b",
          low: "#10b981",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      animation: {
        "pulse-subtle": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "badge-glow": "glow 2s ease-in-out infinite alternate",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 8px rgba(239, 68, 68, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(239, 68, 68, 0.7)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "civic-gradient": "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)",
        "hero-glow": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.15), transparent 70%)",
        "glass-gradient": "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
