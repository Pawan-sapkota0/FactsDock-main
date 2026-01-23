import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const base = tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);

export default [
  ...base,
  // Enable no-console only for client-side source
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-console": "error",
    },
  },
  // Allow console usage in serverless functions, server, and scripts
  {
    files: ["supabase/**", "server/**", "scripts/**"],
    rules: {
      "no-console": "off",
    },
  },
];
