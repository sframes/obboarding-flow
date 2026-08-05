/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F5F4F1",
        surface: "#FFFFFF",
        "surface-2": "#EAE7E0",
        honey: "#F4C10F",
        "deep-honey": "#C99500",
        text: "#111111",
        muted: "#8A8A8A",
        growth: "#22C55E",
        sidebar: "#0B0B0B",
        "sidebar-2": "#1C1C1C",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "rise-in": "riseIn 0.35s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "pulse-honey": "pulseHoney 1.4s ease-in-out infinite",
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseHoney: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
