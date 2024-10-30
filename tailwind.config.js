/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      keyframes: {
        scrollHorizontal: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        scroll: 'scrollHorizontal 10s linear infinite',
      },
      fontFamily: {
        'dotgothic': ['"DotGothic16"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}