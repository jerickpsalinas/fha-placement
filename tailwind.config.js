/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0D1B2E",
        gold: "#C9A84C",
        cream: "#F7F6F2",
        hairline: "#DDD8CC",
        intervention: { DEFAULT: "#9B4E00", bg: "#FEF3E3" },
        onlevel: { DEFAULT: "#0F4C8A", bg: "#E8F0FB" },
        advanced: { DEFAULT: "#2E6B7A", bg: "#EAF3F6" },
        wholegroup: { DEFAULT: "#7A5800", bg: "#FBF5E6" },
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        serif: ["var(--font-heading)", "serif"],
      },
    },
  },
  plugins: [],
};
