import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#000000",
        gold: {
          DEFAULT: "#D4AF37",
          dim: "rgba(212, 175, 55, 0.1)",
          glow: "rgba(212, 175, 55, 0.3)",
        },
        surface: "#0A0A0A",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-cinzel)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;