import markdown from '@eslint/markdown';
import { defineConfig } from 'eslint/config';

// eslint cannot lint markdown content and its code blocks in one run
export default defineConfig([
	{
		name: 'local/ignores',
		ignores: [
			'**/node_modules/**',
			'**/temp/**',
			'**/dist/**',
			'**/build/**',
			'**/.svelte-kit/**',
			'**/.svelte/**',
			'packages/*/CHANGELOG.md',
			'packages/*/CHANGELOG_ARCHIVED.md'
		]
	},
	{
		name: 'local/markdown',
		files: ['**/*.md'],
		plugins: {
			markdown: /** @type {any} */ (markdown)
		},
		extends: ['markdown/recommended'],
		language: 'markdown/gfm',
		rules: {
			'markdown/no-missing-label-refs': [
				'error',
				{
					// github alerts
					allowLabels: ['!NOTE', '!TIP', '!IMPORTANT', '!WARNING', '!CAUTION']
				}
			]
		}
	}
]);
