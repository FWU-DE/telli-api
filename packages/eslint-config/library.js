import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

export default tseslint.config(
  {
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    plugins: {
      "only-warn": onlyWarn,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        projectService: true,
      },
      globals: {
        React: true,
        JSX: true,
      },
    },
    ignores: ["**/node_modules/**", "**/dist/**"],
    // Disable type-aware linting for config files
    files: ["**/*.ts"],
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
