module.exports = {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"] ,
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f7ff",
          100: "#e0edff",
          200: "#b9d8ff",
          300: "#8bbfff",
          400: "#5da0ff",
          500: "#3f82f6",
          600: "#2b65d4",
          700: "#224fa8",
          800: "#1e4386",
          900: "#1c3a6d"
        }
      }
    }
  },
  plugins: []
};
