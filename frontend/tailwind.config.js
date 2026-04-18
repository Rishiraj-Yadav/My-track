/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-variant": "#333537",
        "surface-container-highest": "#333537",
        "inverse-on-surface": "#2f3133",
        "on-secondary-container": "#342800",
        "on-tertiary-fixed-variant": "#930013",
        "primary-fixed-dim": "#4edea3",
        "tertiary-container": "#2f0002",
        "surface-container-lowest": "#0c0e10",
        "outline-variant": "#444748",
        "on-secondary-fixed": "#241a00",
        "tertiary-fixed-dim": "#ffb3ad",
        "background": "#121416",
        "tertiary-fixed": "#ffdad7",
        "on-primary-fixed-variant": "#005236",
        "on-primary-fixed": "#002113",
        "outline": "#8e9192",
        "on-primary": "#003824",
        "error-container": "#93000a",
        "on-primary-container": "#008f62",
        "primary-container": "#00160c",
        "on-tertiary-fixed": "#410004",
        "surface-container-high": "#282a2c",
        "on-background": "#e2e2e5",
        "on-error-container": "#ffdad6",
        "surface-bright": "#37393b",
        "on-tertiary": "#68000a",
        "inverse-primary": "#006c49",
        "primary": "#4edea3",
        "secondary-fixed-dim": "#e9c349",
        "primary-fixed": "#6ffbbe",
        "surface-dim": "#121416",
        "secondary-fixed": "#ffe088",
        "on-secondary-fixed-variant": "#574500",
        "tertiary": "#ffb3ad",
        "surface-container": "#1e2022",
        "surface-container-low": "#1a1c1e",
        "inverse-surface": "#e2e2e5",
        "on-surface": "#e2e2e5",
        "on-surface-variant": "#c4c7c7",
        "secondary": "#e9c349",
        "error": "#ffb4ab",
        "secondary-container": "#af8d11",
        "on-secondary": "#3c2f00",
        "surface": "#121416",
        "on-error": "#690005",
        "surface-tint": "#4edea3",
        "on-tertiary-container": "#e63e3f"
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
