import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

export default typescriptEslint.config(
  {
    ignores: ["dist", "src-tauri/target"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      eslint.configs.recommended,
      ...typescriptEslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
);
