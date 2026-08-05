/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#15130E",
        surface: "#1E1A13",
        "surface-2": "#28230F",
        honey: "#F2A93B",
        "deep-honey": "#C97D1F",
        text: "#F3EDE1",
        muted: "#8F8570",
        growth: "#6FCF97",
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
