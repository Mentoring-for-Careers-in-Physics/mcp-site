import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["dist/**", "node_modules/**", ".astro/**", "public/**"],
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        document: "readonly",
        fetch: "readonly",
        window: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        Response: "readonly",
        Set: "readonly",
        Map: "readonly",
        process: "readonly",
      },
    },
  },
];
