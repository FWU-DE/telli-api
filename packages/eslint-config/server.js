module.exports = {
  extends: ["eslint:recommended"],
  env: {
    node: true,
    es6: true,
    es2017: true,
    es2018: true,
  },
  globals: {
    AsyncGenerator: "readonly",
    AsyncIterable: "readonly",
    AsyncIterator: "readonly",
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  overrides: [
    {
      files: ["**/__tests__/**/*"],
      env: {
        jest: true,
      },
    },
  ],
};
