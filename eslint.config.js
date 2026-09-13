import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "js/tengwar-core.js",
      "js/html2canvas.min.js",
      "node_modules/**"
    ]
  },
  {
    files: ["**/*.js"],
    ignores: ["js/tengwar-core.js", "js/html2canvas.min.js"],
    languageOptions: {
      ecmaVersion: 5,
      sourceType: "script",
      globals: {
        ...globals.browser,
        html2canvas: "readonly",
        Promise: "readonly",
        caches: "readonly"
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-var": "off",
      "prefer-const": "off",
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "no-unused-vars": ["error", { "argsIgnorePattern": "^e$", "caughtErrors": "none" }]
    }
  }
];