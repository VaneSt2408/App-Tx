// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}", // Si el archivo está en la raíz
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // ESTA ES LA LÍNEA QUE FALTA
  presets: [require("nativewind/preset")],
};