/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#004d2a",
        "primary-deep": "#00341b",
        gold: "#775a19",
        surface: "#fbf9f4",
      },
      fontFamily: {
        sans: ["Public Sans", "system-ui", "sans-serif"],
        ml: ["Manjari", "Public Sans", "sans-serif"],
        display: ['"Playfair Display"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
