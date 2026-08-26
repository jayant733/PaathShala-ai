/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "system-ui", "-apple-system", "sans-serif"],
        display: ["Geist", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        body: ["Inter", "Geist", "system-ui", "sans-serif"],
        title: ["Geist", "Inter", "system-ui", "sans-serif"],
        label: ["Inter", "Geist", "system-ui", "sans-serif"],
        "label-caps": ['"JetBrains Mono"', "monospace"],
        "body-md": ['"Hanken Grotesk"', "sans-serif"],
        "button-text": ['"Plus Jakarta Sans"', "sans-serif"],
        "headline-lg": ['"Plus Jakarta Sans"', "sans-serif"],
        "body-lg": ['"Hanken Grotesk"', "sans-serif"],
        "display-lg-mobile": ['"Plus Jakarta Sans"', "sans-serif"],
        "headline-xl": ['"Plus Jakarta Sans"', "sans-serif"],
        "display-lg": ['"Plus Jakarta Sans"', "sans-serif"]
      },
      colors: {
        "error-container": "#ffdad6", "on-primary-fixed": "#002117", "on-error": "#ffffff", "outline-variant": "#bfc9c3", "secondary": "#2dd4bf", "surface-container-highest": "#e5e3d0", "surface-container-lowest": "#ffffff", "surface-container-low": "#f6f4e1", "secondary-container": "#ccfbf1", "on-secondary-fixed-variant": "#0f766e", "surface-container-high": "#ebe9d5", "on-secondary-fixed": "#042f2e", "tertiary-container": "#821057", "tertiary-fixed": "#ffd8e7", "surface-dim": "#dcdbc8", "on-tertiary-fixed-variant": "#85145a", "surface-tint": "#2b6954", "surface-bright": "#fcfae6", "on-error-container": "#93000a", "background": "#fcfae6", "secondary-fixed": "#99f6e4", "primary-container": "#064e3b", "on-secondary-container": "#115e59", "on-secondary": "#042f2e", "inverse-surface": "#313124", "tertiary": "#5e003d", "on-tertiary-fixed": "#3d0026", "error": "#ba1a1a", "on-tertiary-container": "#ff8dc5", "surface-container": "#f0efdb", "surface-border": "#000000", "outline": "#707974", "inverse-primary": "#95d3ba", "primary": "#003527", "on-primary": "#ffffff", "on-primary-container": "#80bea6", "on-background": "#1c1c10", "mint-accent": "#D1FAE5", "surface-variant": "#e5e3d0", "inverse-on-surface": "#f3f2de", "secondary-fixed-dim": "#5eead4", "primary-fixed-dim": "#95d3ba", "tertiary-fixed-dim": "#ffafd3", "ink-black": "#111827", "on-surface": "#1c1c10", "primary-fixed": "#b0f0d6", "on-primary-fixed-variant": "#0b513d", "surface": "#fcfae6", "on-tertiary": "#ffffff", "on-surface-variant": "#404944"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        "margin-desktop": "64px",
        unit: "4px",
        "section-gap": "120px",
        "margin-mobile": "16px",
        gutter: "24px",
        "container-padding-mobile": "20px",
        "container-padding-desktop": "40px",
        "max-width": "1280px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "32px",
        "container-max": "1280px",
      },
      fontSize: {
        "label-xs": ["11px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.04em", fontWeight: "600" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.02em", fontWeight: "500" }],
        "label-lg": ["16px", { lineHeight: "22px", letterSpacing: "0.01em", fontWeight: "600" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "title-sm": ["16px", { lineHeight: "22px", letterSpacing: "-0.005em", fontWeight: "600" }],
        "title-md": ["18px", { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "title-lg": ["22px", { lineHeight: "28px", letterSpacing: "-0.015em", fontWeight: "650" }],
        "title-large": ["28px", { lineHeight: "34px", letterSpacing: "-0.02em", fontWeight: "650" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        display: ["clamp(2rem, 3.25vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.035em", fontWeight: "700" }],
        "display-sm": ["30px", { lineHeight: "36px", letterSpacing: "-0.025em", fontWeight: "700" }],
        code: ["14px", { lineHeight: "22px", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "button-text": ["16px", { lineHeight: "1", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "1.3", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "display-lg-mobile": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-xl": ["48px", { lineHeight: "1.2", fontWeight: "800" }],
        "display-lg": ["72px", { lineHeight: "1.1", letterSpacing: "-0.04em", fontWeight: "800" }]
      },
      maxWidth: {
        "max-width": "1280px",
      },
    },
  },
  plugins: [],
}
