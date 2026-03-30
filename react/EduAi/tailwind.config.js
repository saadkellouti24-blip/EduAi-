/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- TRÈS IMPORTANT : Dit à Tailwind de scanner vos fichiers React
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}