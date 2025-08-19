module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    browser: true,
  },
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
    'eol-last': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'max-len': ['warn', { code: 100, ignoreUrls: true, ignoreStrings: true }],

    // Prettier integration
    'prettier/prettier': 'error',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'prettier',
      ],
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      rules: {
        // TypeScript specific rules
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-unused-vars': 'off', // Turn off base rule as it can report incorrect errors
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['scripts/**/*', 'tools/**/*'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    'docker-volumes/',
    'tmp/',
    'test-results/',
    'backend/coverage/',
    'frontend/coverage/',
    'backend/.eslintrc.js',
    'frontend/.eslintrc.cjs',
    '**/*.d.ts',
  ],
};