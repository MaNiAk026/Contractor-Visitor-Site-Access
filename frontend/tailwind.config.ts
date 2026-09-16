import type { Config } from "tailwindcss";

/** Tailwind source and theme configuration for the operations application. */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 12px 34px rgba(20, 39, 34, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
