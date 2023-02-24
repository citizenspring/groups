/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    "./.cache/tmp/*.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("flowbite/plugin"), require("flowbite-typography")],
};
