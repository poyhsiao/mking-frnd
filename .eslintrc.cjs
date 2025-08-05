module.exports = {
	root: true,
	env: {
		node: true,
		es2022: true,
		browser: true,
	},
	extends: ["eslint:recommended", "prettier"],
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: "module",
	},
	plugins: ["prettier"],
	rules: {
		// Basic rules
		"no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

		// General rules
		"no-console": "warn",
		"no-debugger": "error",
		"no-alert": "error",
		"no-var": "error",
		"prefer-const": "error",
		"prefer-arrow-callback": "error",
		"arrow-spacing": "error",
		"no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
		"eol-last": "error",
		"comma-dangle": ["error", "always-multiline"],
		semi: ["error", "always"],
		quotes: ["error", "single", { avoidEscape: true }],
		"object-curly-spacing": ["error", "always"],
		"array-bracket-spacing": ["error", "never"],
		"computed-property-spacing": ["error", "never"],
		"space-in-parens": ["error", "never"],
		"keyword-spacing": "error",
		"space-before-blocks": "error",
		"brace-style": ["error", "1tbs", { allowSingleLine: true }],
		indent: ["error", 2, { SwitchCase: 1 }],
		"max-len": ["warn", { code: 100, ignoreUrls: true, ignoreStrings: true }],

		// Prettier integration
		"prettier/prettier": "error",
	},
	settings: {
		"import/resolver": {
			typescript: {
				alwaysTryTypes: true,
				project: [
					"./tsconfig.json",
					"./backend/tsconfig.json",
					"./frontend/tsconfig.json",
				],
			},
			node: {
				extensions: [".js", ".jsx", ".ts", ".tsx"],
			},
		},
	},
	overrides: [
		{
			files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
			env: {
				jest: true,
				"vitest-globals/env": true,
			},
			extends: ["plugin:vitest-globals/recommended"],
			rules: {
				"no-console": "off",
			},
		},
		{
			files: ["**/*.js"],
			rules: {
				"@typescript-eslint/no-var-requires": "off",
				"@typescript-eslint/explicit-function-return-type": "off",
			},
		},
		{
			files: ["scripts/**/*", "tools/**/*"],
			rules: {
				"no-console": "off",
				"@typescript-eslint/no-var-requires": "off",
			},
		},
	],
	ignorePatterns: [
		"node_modules/",
		"dist/",
		"build/",
		"coverage/",
		"*.min.js",
		"public/",
		"tmp/",
		"test-results/",
		"docker-volumes/",
		"docs/",
		"tmp/",
		"logs/",
		"dist/",
		"coverage/",
		"*.md",
	],
};
