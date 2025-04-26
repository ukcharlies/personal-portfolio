/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./src/**/*.{html,js}"],
  theme: {
    extend: {
      zIndex: {
        1000: "1000",
      },
      keyframes: {
        scrollHorizontal: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        scroll: "scrollHorizontal 10s linear infinite",
      },
      fontFamily: {
        dotgothic: ['"DotGothic16"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
