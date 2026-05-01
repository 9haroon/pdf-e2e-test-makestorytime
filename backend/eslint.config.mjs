import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/** Backend ESLint flat config — avoids type-checked rules that require full project graph before install */
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/", "node_modules/", "coverage/", "**/*.js", "prisma/"],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  }
);
