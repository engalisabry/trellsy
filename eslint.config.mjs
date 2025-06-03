import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-vitals"),
  {
    // Ignore Prisma generated files
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/lib/generated/**',
      '**/prisma/generated/**'
    ]
  },
  {
    // Global TypeScript rules
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/ban-ts-comment': 'off'
    }
  },
  {
    // Next.js specific rules
    files: ['**/*.tsx'],
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'off'
    }
  }
];

export default eslintConfig;
