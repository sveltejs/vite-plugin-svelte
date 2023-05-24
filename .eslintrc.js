module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:n/recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'prettier'
	],
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly'
	},
	plugins: ['@typescript-eslint', 'svelte3', 'html', 'markdown'],
	settings: {
		'svelte3/typescript': require('typescript'),
		'svelte3/ignore-styles': (attrs) =>
			(attrs.type && attrs.type !== 'text/css') || (attrs.lang && attrs.lang !== 'css')
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020
	},
	rules: {
		'n/no-unsupported-features/es-builtins': 'error',
		'n/no-unsupported-features/es-syntax': 'error',
		'no-console': 'off',
		'no-debugger': 'error',
		'n/no-missing-import': [
			'error',
			{
				allowModules: ['types', 'estree', 'testUtils', '@sveltejs/vite-plugin-svelte', 'svelte']
			}
		],
		'n/no-missing-require': [
			'error',
			{
				// for try-catching yarn pnp
				allowModules: ['pnpapi']
			}
		],

		'n/no-extraneous-import': [
			'error',
			{
				allowModules: ['vite', 'vitest']
			}
		],
		'n/no-extraneous-require': [
			'error',
			{
				allowModules: ['vite']
			}
		],
		'n/no-deprecated-api': 'off',
		'no-restricted-properties': [
			'error',
			{ property: 'substr', message: 'Use .slice instead of .substr.' }
		],
		'n/no-unpublished-import': 'off',
		'n/no-unpublished-require': 'off',
		'no-process-exit': 'off'
	},
	overrides: [
		{
			files: ['packages/vite-plugin-svelte/src/**'],
			rules: {
				'no-console': 'error'
			}
		},
		{
			files: ['packages/vite-plugin-svelte-inspector/src/runtime/load-inspector.js'],
			env: {
				browser: true
			}
		},
		{
			files: ['**/*.d.ts'],
			rules: {
				'no-unused-vars': 'off'
			}
		},
		{
			files: ['packages/e2e-tests/**', 'packages/playground/**'],
			rules: {
				'n/no-extraneous-import': 'off',
				'n/no-extraneous-require': 'off',
				'no-unused-vars': 'off'
			},
			env: {
				browser: true
			}
		},
		{
			files: ['packages/e2e-tests/**/vite.config.js', 'packages/playground/**'],
			rules: {
				'no-unused-vars': 'off',
				'n/no-missing-require': 'off'
			}
		},
		{
			files: ['**/*.svelte'],
			env: {
				es6: true,
				browser: true,
				node: false
			},
			processor: 'svelte3/svelte3',
			rules: {
				'import/first': 'off',
				'import/no-duplicates': 'off',
				'import/no-mutable-exports': 'off',
				'import/no-unresolved': 'off',
				'n/no-missing-import': 'off' // doesn't work with typescript's "import from 'src/foo.js'" for src/foo.ts
			}
		},
		{
			files: ['**/*.svx', '**/*.md'],
			processor: 'markdown/markdown',
			rules: {
				'no-undef': 'off',
				'no-unused-vars': 'off',
				'no-unused-labels': 'off',
				'no-console': 'off',
				'padded-blocks': 'off',
				'n/no-missing-import': 'off',
				'n/no-extraneous-require': 'off',
				'import/no-unresolved': 'off',
				'n/no-missing-require': 'off'
			}
		},
		{
			files: ['**/*.svx/*.**', '**/*.md/*.**'],
			rules: {
				'no-undef': 'off',
				'no-unused-vars': 'off',
				'no-unused-labels': 'off',
				'no-console': 'off',
				'padded-blocks': 'off',
				'n/no-missing-import': 'off',
				'n/no-extraneous-require': 'off',
				'import/no-unresolved': 'off',
				'n/no-missing-require': 'off'
			}
		},
		{
			files: ['**/__tests__/**/*.spec.ts'],
			env: {
				jest: true,
				node: true,
				browser: true
			},
			rules: {
				'n/no-extraneous-import': 'off',
				'n/no-missing-import': 'off',
				'n/no-unused-import': 'off'
			}
		},
		{
			files: ['packages/playground/kit-demo-app/src/**'],
			rules: {
				/* required because $app and $lib are not known */
				'n/no-missing-import': 'off',
				/* required because URL wasn't in node8 */
				'n/no-unsupported-features/node-builtins': 'off'
			}
		},
		{
			files: ['**/*.d.ts'],
			rules: {
				'no-unused-vars': 'off'
			}
		}
	]
};
