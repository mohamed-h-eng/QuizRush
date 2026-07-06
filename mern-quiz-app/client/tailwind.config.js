/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9ecff",
          500: "#3d7fe0",
          600: "#2f66c2",
          700: "#28549e",
        },
      },
    },
  },
  plugins: [],
};
