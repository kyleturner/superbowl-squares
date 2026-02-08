import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nfl: {
          dark: "#0d0d0d",
          charcoal: "#1a1a1a",
          slate: "#374151",
          "number-bg": "#e5e7eb",
          square: "#ffffff",
          seahawks: "#002244",
          "seahawks-accent": "#69be28",
          patriots: "#0d2341",
          "patriots-accent": "#c60c30",
        },
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
      spacing: {
        safe: "env(safe-area-inset-bottom)",
      },
      screens: {
        touch: { raw: "(pointer: coarse)" },
      },
    },
  },
  plugins: [],
};

export default config;
