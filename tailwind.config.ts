import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#080d1d",
        muted: "#64748b",
        line: "#dbe3ed",
        panel: "#f8fafc"
      },
      boxShadow: {
        plate: "0 1px 2px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
