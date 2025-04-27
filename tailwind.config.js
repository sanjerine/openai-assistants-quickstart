/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#ffce11",
        "primary-dark": "#e6b800",
        dark: "#333",
      },
      fontFamily: {
        sans: ["var(--font-titillium-web)", "sans-serif"],
      },
      keyframes: {
        bounce: {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
      },
      animation: {
        bounce: "bounce 1.4s infinite ease-in-out both",
      },
    },
  },
  plugins: [],
};
