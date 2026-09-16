import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#190f2e",
        panel: "#241a42",
        "panel-line": "#3a2a5e",
        cream: "#fff8ec",
        gold: "#ffc94d",
        "gold-deep": "#e69a1f",
        pink: "#ff6fa5",
        mint: "#6fe7c4",
        text: "#f5efff",
        "text-dim": "#b7a9d9"
      },
      fontFamily: {
        display: ["Jua", "sans-serif"],
        body: ["Gowun Dodum", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
