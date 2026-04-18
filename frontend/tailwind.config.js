/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-variant": token('--surface-variant'),
        "surface-container-highest": token('--surface-container-highest'),
        "inverse-on-surface": token('--inverse-on-surface'),
        "on-secondary-container": token('--on-secondary-container'),
        "on-tertiary-fixed-variant": token('--on-tertiary-fixed-variant'),
        "primary-fixed-dim": token('--primary-fixed-dim'),
        "tertiary-container": token('--tertiary-container'),
        "surface-container-lowest": token('--surface-container-lowest'),
        "outline-variant": token('--outline-variant'),
        "on-secondary-fixed": token('--on-secondary-fixed'),
        "tertiary-fixed-dim": token('--tertiary-fixed-dim'),
        "background": token('--background'),
        "tertiary-fixed": token('--tertiary-fixed'),
        "on-primary-fixed-variant": token('--on-primary-fixed-variant'),
        "on-primary-fixed": token('--on-primary-fixed'),
        "outline": token('--outline'),
        "on-primary": token('--on-primary'),
        "error-container": token('--error-container'),
        "on-primary-container": token('--on-primary-container'),
        "primary-container": token('--primary-container'),
        "on-tertiary-fixed": token('--on-tertiary-fixed'),
        "surface-container-high": token('--surface-container-high'),
        "on-background": token('--on-background'),
        "on-error-container": token('--on-error-container'),
        "surface-bright": token('--surface-bright'),
        "on-tertiary": token('--on-tertiary'),
        "inverse-primary": token('--inverse-primary'),
        "primary": token('--primary'),
        "secondary-fixed-dim": token('--secondary-fixed-dim'),
        "primary-fixed": token('--primary-fixed'),
        "surface-dim": token('--surface-dim'),
        "secondary-fixed": token('--secondary-fixed'),
        "on-secondary-fixed-variant": token('--on-secondary-fixed-variant'),
        "tertiary": token('--tertiary'),
        "surface-container": token('--surface-container'),
        "surface-container-low": token('--surface-container-low'),
        "inverse-surface": token('--inverse-surface'),
        "on-surface": token('--on-surface'),
        "on-surface-variant": token('--on-surface-variant'),
        "secondary": token('--secondary'),
        "error": token('--error'),
        "secondary-container": token('--secondary-container'),
        "on-secondary": token('--on-secondary'),
        "surface": token('--surface'),
        "on-error": token('--on-error'),
        "surface-tint": token('--surface-tint'),
        "on-tertiary-container": token('--on-tertiary-container')
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
