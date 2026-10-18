import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0B0D",
          900: "#101216",
          850: "#15181D",
          800: "#1B1F26",
          700: "#242A33",
          600: "#333B47",
          500: "#4A5361",
          400: "#6B7482",
          300: "#9099A6",
          200: "#C2C8D1",
          100: "#E5E8ED",
        },
        gold: {
          50: "#FBF6E8",
          100: "#F3E6B8",
          200: "#E9D389",
          300: "#DBBB5C",
          400: "#C9A33E",
          500: "#B2892C",
          600: "#8E6D22",
          700: "#6B521A",
        },
        accent: {
          emerald: "#2FBF77",
          amber: "#E0A62F",
          rose: "#E05A5A",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["clamp(2.5rem,5vw,4rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      boxShadow: {
        glass: "0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 60px -24px rgba(0,0,0,0.6)",
        gold: "0 10px 40px -12px rgba(201,163,62,0.35)",
      },
      backgroundImage: {
        "grain": "radial-gradient(1200px 600px at 0% -10%, rgba(201,163,62,0.08), transparent 60%), radial-gradient(1000px 500px at 110% 10%, rgba(47,191,119,0.05), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
