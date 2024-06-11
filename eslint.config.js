import html from 'eslint-plugin-html';
import markdown from 'eslint-plugin-markdown';
import unicorn from 'eslint-plugin-unicorn';
import typescript from 'typescript-eslint';

import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';
import n from 'eslint-plugin-n';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import svelte_config from '@sveltejs/eslint-config';

const globalsBrowserWithoutNode = {
	...Object.fromEntries(Object.entries(globals.node).map(([key]) => [key, 'off'])),
	...globals.browser
};

export default [
	...svelte_config,
	{
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
	js.configs.recommended,
	n.configs['flat/recommended-module'],
	...svelte.configs['flat/recommended'],
	...typescript.configs.recommended,
	prettierRecommended,
	{
		plugins: {
			html,
			markdown,
			unicorn
		},

		languageOptions: {
			globals: {
				Atomics: 'readonly',
				SharedArrayBuffer: 'readonly',
				$derived: 'readonly',
				$effect: 'readonly',
				$props: 'readonly',
				$state: 'readonly'
			},

			parser: typescript.parser,
			ecmaVersion: 2020,
			sourceType: 'module',

			parserOptions: {
				extraFileExtensions: ['.svelte']
			}
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
		files: ['packages/vite-plugin-svelte/src/**'],
		rules: {
			'no-console': 'error'
		}
	},
	{
		files: [
			'packages/vite-plugin-svelte-inspector/src/runtime/load-inspector.js',
			'packages/vite-plugin-svelte-inspector/src/runtime/Inspector.svelte'
		],

		languageOptions: {
			globals: globalsBrowserWithoutNode
		},

		rules: {
			'n/no-unsupported-features/node-builtins': 'off'
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

		languageOptions: {
			globals: {
				...globals.browser
			}
		},

		rules: {
			'n/no-extraneous-import': 'off',
			'n/no-extraneous-require': 'off',
			'no-unused-vars': 'off'
		}
	},
	{
		files: [
			'packages/e2e-tests/_test_dependencies/cjs-only/**',
			'packages/e2e-tests/_test_dependencies/index-only/**',
			'packages/e2e-tests/_test_dependencies/vite-plugins/**'
		],

		rules: {
			'no-undef': 'off'
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

		languageOptions: {
			globals: globalsBrowserWithoutNode,
			parser: svelteParser,
			ecmaVersion: 5,
			sourceType: 'script',

			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		},

		rules: {
			'import/first': 'off',
			'import/no-duplicates': 'off',
			'import/no-mutable-exports': 'off',
			'import/no-unresolved': 'off',
			'n/no-missing-import': 'off'
		}
	},
	{
		files: ['**/*.svx', '**/*.md'],

		rules: {
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'no-unused-labels': 'off',
			'no-console': 'off',
			'padded-blocks': 'off',
			'n/no-missing-import': 'off',
			'n/no-extraneous-require': 'off',
			'import/no-unresolved': 'off',
			'n/no-missing-require': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		},

		processor: 'markdown/markdown'
	},
	{
		files: [
			'**/*.svx/*.js',
			'**/*.md/*.js',
			'**/*.svx/*.ts',
			'**/*.md/*.ts',
			'**/*.svx/*.svelte',
			'**/*.md/*.svelte'
		],

		rules: {
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'no-unused-labels': 'off',
			'no-console': 'off',
			'padded-blocks': 'off',
			'n/no-missing-import': 'off',
			'n/no-extraneous-require': 'off',
			'import/no-unresolved': 'off',
			'n/no-missing-require': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	},
	{
		files: ['**/__tests__/**/*.spec.ts'],

		languageOptions: {
			globals: {
				...globals.jest,
				...globals.node,
				...globals.browser
			}
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
			'n/no-missing-import': 'off',
			'n/no-unsupported-features/node-builtins': 'off'
		}
	},
	{
		files: ['**/*.d.ts'],

		rules: {
			'no-unused-vars': 'off'
		}
	},
	{
		files: ['**/vite.config.*', 'packages/e2e-tests/**'],

		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	},
	{
		files: ['packages/playground/**'],
		rules: {
			'@typescript-eslint/no-unused-expressions': 'off'
		}
	}
];
