/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@dgpt/eslint-config/server.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  rules: {
    "no-inner-declarations": "off",
    "no-constant-condition": "off",
  },
}; 