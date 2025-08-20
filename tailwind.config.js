/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#ffffff",          // page background (white)
          surface: "#f9fafb",     // section/card background (gray-50)
          border: "#e5e7eb",      // gray-200
          text: "#1f2937",        // gray-800
          subtext: "#6b7280",     // gray-500
          accent: "#2563eb",      // blue-600
          accentHover: "#1d4ed8", // blue-700
        },
      },
    },
  },
  plugins: [],
}
