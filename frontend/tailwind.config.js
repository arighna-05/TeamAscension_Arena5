/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "surface": "#f9faf7",
        "on-surface-variant": "#434840",
        "on-error-container": "#93000a",
        "on-tertiary-fixed-variant": "#414941",
        "on-surface": "#191c1b",
        "error": "#ba1a1a",
        "secondary": "#51634a",
        "primary-fixed": "#caecbc",
        "outline-variant": "#c3c8bd",
        "surface-container": "#edeeeb",
        "error-container": "#ffdad6",
        "on-secondary-container": "#576a50",
        "tertiary-container": "#5a625a",
        "surface-tint": "#496640",
        "primary": "#334f2b",
        "on-primary-fixed": "#062104",
        "on-primary-fixed-variant": "#324e2a",
        "on-tertiary": "#ffffff",
        "surface-container-high": "#e7e8e6",
        "secondary-container": "#d4e9c8",
        "surface-variant": "#e2e3e0",
        "on-secondary": "#ffffff",
        "on-secondary-fixed": "#0f1f0b",
        "surface-container-lowest": "#ffffff",
        "outline": "#73796f",
        "inverse-surface": "#2e312f",
        "on-secondary-fixed-variant": "#3a4b34",
        "surface-bright": "#f9faf7",
        "on-tertiary-fixed": "#161d17",
        "secondary-fixed-dim": "#b8cdae",
        "primary-fixed-dim": "#afd0a1",
        "tertiary": "#424a43",
        "on-primary-container": "#c2e4b4",
        "on-tertiary-container": "#d5ddd3",
        "primary-container": "#4a6741",
        "surface-container-low": "#f3f4f1",
        "on-background": "#191c1b",
        "surface-container-highest": "#e2e3e0",
        "on-primary": "#ffffff",
        "surface-dim": "#d9dad7",
        "tertiary-fixed": "#dde5db",
        "tertiary-fixed-dim": "#c1c9bf",
        "inverse-primary": "#afd0a1",
        "on-error": "#ffffff",
        "secondary-fixed": "#d4e9c8",
        "background": "#f9faf7",
        "inverse-on-surface": "#f0f1ee",
        "primary-fixed-variant": "#3d5935",
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "full": "9999px"
      },
      "spacing": {
        "container-padding": "24px",
        "bento-gap": "16px",
        "unit": "4px",
        "gutter": "24px",
        "margin": "32px"
      },
      "fontFamily": {
        "body-lg": ["Work Sans", "sans-serif"],
        "headline-md": ["Manrope", "sans-serif"],
        "label-sm": ["Work Sans", "sans-serif"],
        "body-md": ["Work Sans", "sans-serif"],
        "body-sm": ["Work Sans", "sans-serif"],
        "headline-xl": ["Manrope", "sans-serif"],
        "headline-lg": ["Manrope", "sans-serif"],
        "headline-sm": ["Manrope", "sans-serif"],
        "display-sm": ["Manrope", "sans-serif"],
        "label-bold": ["Work Sans", "sans-serif"]
      },
      "fontSize": {
        "body-lg":     ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
        "body-sm":     ["13px", {"lineHeight": "18px", "fontWeight": "400"}],
        "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "700"}],
        "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
        "label-sm":    ["12px", {"lineHeight": "16px", "fontWeight": "500"}],
        "body-md":     ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-xl": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "800"}],
        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
        "display-sm":  ["36px", {"lineHeight": "44px", "letterSpacing": "-0.015em", "fontWeight": "800"}],
        "label-bold":  ["14px", {"lineHeight": "20px", "fontWeight": "600"}]
      },
      "animation": {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
      "keyframes": {
        "fadeIn": {
          "from": { "opacity": "0", "transform": "translateY(8px)" },
          "to":   { "opacity": "1", "transform": "translateY(0)" },
        },
        "slideUp": {
          "from": { "opacity": "0", "transform": "translateY(20px)" },
          "to":   { "opacity": "1", "transform": "translateY(0)" },
        }
      },
      "boxShadow": {
        "bento": "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
      }
    }
  },
  plugins: [],
}

