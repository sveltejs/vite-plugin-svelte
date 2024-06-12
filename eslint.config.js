import html from 'eslint-plugin-html';
import markdown from 'eslint-plugin-markdown';
import globals from 'globals';
import n from 'eslint-plugin-n';
import svelte_config from '@sveltejs/eslint-config';

export default [
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
	...svelte_config, // contains setup for svelte, typescript and unicorn
	n.configs['flat/recommended-module'],
	{
		plugins: {
			html,
			markdown
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
			ecmaVersion: 2022,
			sourceType: 'module'
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
			globals: {
				...globals.browser
			}
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
		files: ['**/*.svx', '**/*.md'],
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
