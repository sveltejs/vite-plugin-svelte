import markdown from 'eslint-plugin-markdown';
import globals from 'globals';
import n from 'eslint-plugin-n';
import svelteOrgEslintConfig from '@sveltejs/eslint-config';
import svelteParser from 'svelte-eslint-parser';
export default [
	{
		name: 'local/ignores',
		ignores: [
			'**/temp/**',
			'**/dist/**',
			'**/build/**',
			'**/.svelte-kit/**',
			'**/.svelte/**',
			'packages/playground/big/src/pages/**', // lots of generated files
			'packages/*/types/index.d.ts',
			'packages/*/types/index.d.ts.map',
			'packages/*/CHANGELOG.md'
		]
	},
	...svelteOrgEslintConfig, // contains setup for svelte, typescript and unicorn
	n.configs['flat/recommended-module'],
	...markdown.configs.recommended,
	{
		name: 'local/language-options',
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module'
		}
	},
	{
		name: 'local/generic-rules',
		rules: {
			'n/no-unsupported-features/es-builtins': 'error',
			'n/no-unsupported-features/es-syntax': 'error',
			'no-console': 'off',
			'no-debugger': 'error',

			'n/no-extraneous-import': [
				'error',
				{
					allowModules: ['vite', 'vitest']
				}
			],

			'no-restricted-properties': [
				'error',
				{
					property: 'substr',
					message: 'Use .slice instead of .substr.'
				}
			],

			'n/no-unpublished-import': 'off',
			'n/no-unpublished-require': 'off',
			'no-process-exit': 'off',

			'prefer-const': [
				'error',
				{
					destructuring: 'all'
				}
			],

			quotes: [
				'error',
				'single',
				{
					avoidEscape: true
				}
			],

			'unicorn/prefer-node-protocol': 'error'
		}
	},
	{
		name: 'local/packages-src',
		files: ['packages/*/src/**'],
		rules: {
			'no-console': 'error'
		}
	},
	{
		name: 'local/inspector-extras',
		files: [
			'packages/vite-plugin-svelte-inspector/src/runtime/load-inspector.js',
			'packages/vite-plugin-svelte-inspector/src/runtime/Inspector.svelte'
		],

		languageOptions: {
			globals: {
				...globals.browser
			}
		},
		rules: {
			'n/no-unsupported-features/node-builtins': 'off'
		}
	},
	{
		name: 'local/tests-and-playground-rules',
		files: ['packages/e2e-tests/**', 'packages/playground/**'],

		rules: {
			'n/no-extraneous-import': 'off'
		}
	},
	{
		name: 'local/svelte-files',
		files: ['**/*.svelte'],

		languageOptions: {
			globals: {
				...globals.browser
			},
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		},

		rules: {
			'n/no-missing-import': 'off' // n doesn't know some vite specifics or monorepo imports.
		}
	},
	{
		name: 'local/svelte-runes-globals',
		files: ['**/*.svelte.js', '**/*.svelte.ts', '**/*.svelte.*.js', '**/*.svelte.*.ts'],
		languageOptions: {
			parser: svelteParser
		}
	},
	{
		name: 'local/markdown-codefences',
		files: ['**/*.md/*.js', '**/*.md/*.ts', '**/*.md/*.svelte'],
		rules: {
			'n/no-missing-import': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	},
	{
		name: 'local/spec-files',
		files: ['**/__tests__/**/*.spec.ts'],

		languageOptions: {
			globals: {
				...globals.jest,
				...globals.node,
				...globals.browser
			}
		},
		rules: {
			'n/no-missing-import': 'off'
		}
	},
	{
		name: 'local/allow-unused-vars',
		files: ['**/vite.config.*', 'packages/e2e-tests/**', '**/*.d.ts'],
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	}
];
