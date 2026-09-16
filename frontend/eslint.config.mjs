import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
});

export default [
  ...compat.config({
    extends: ["eslint-config-next/core-web-vitals.js"]
  }),
  globalIgnores([
    ".next/**",
    "coverage/**",
    "test-results/**",
    "next-env.d.ts"
  ])
];
