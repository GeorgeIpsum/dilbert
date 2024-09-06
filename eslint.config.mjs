import eslint from "@eslint/js";
import parser from "@typescript-eslint/parser";
import "eslint-plugin-only-warn";
import prettierlint from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

/**
 * @typedef {import('prettier').Config} BaseConfig
 * @typedef {import('@trivago/prettier-plugin-sort-imports').PrettierConfig} ImportsConfig
 */
/**
 * @type {BaseConfig & ImportsConfig}
 **/
const config = {
  bracketSpacing: true,
  singleQuote: false,
  jsxSingleQuote: false,

  plugins: ["@trivago/prettier-plugin-sort-imports"],

  // import order plugin config
  importOrder: [
    "<BUILTIN_MODULES>",
    "<THIRD_PARTY_MODULES>", // Third-party modules
    "^[./]", // Relative imports
    "<TYPES>^[.]",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderGroupNamespaceSpecifiers: true,
  importOrderParserPlugins: ["typescript", "jsx", "decorators"],

  // tailwind plugin config
  tailwindFunctions: ["clsx", "cx", "cn"],
  tailwindAttributes: ["className", "ClassName", "*ClassName"],
};

export default tseslint.config(
  eslint.configs.recommended,
  prettierlint,
  tseslint.configs.eslintRecommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "prettier/prettier": ["warn", config],
      "@typescript-eslint/no-floating-promises": ["off"],
      // "@typescript-eslint/ban-types": [
      //   "warn",
      //   {
      //     extendDefaults: true,
      //     types: {
      //       "{}": false,
      //     },
      //   },
      // ],
    },
  },
);
