/** @type {import("prettier").Config} */
export default {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100,
	plugins: ['prettier-plugin-svelte'],
	overrides: [
		{
			files: '**/*.svx',
			options: { parser: 'markdown' }
		},
		{
			files: '**/*.ts',
			options: { parser: 'typescript' }
		},
		{
			files: [
				'**/CHANGELOG.md',
				'.github/renovate.json5',
				'**/types/index.d.ts',
				'**/types/index.d.ts.map',
				'**/pnpm-lock.yaml',
				'.changeset/pre.json',
				'**/vite.config.js.timestamp-*.mjs',
				'packages/e2e-tests/dynamic-compile-options/src/components/A.svelte',
				'packages/playground/big/src/pages/**', // lots of generated files
				'packages/e2e-tests/scan-deps/src/Svelte*.svelte', // various syntax tests that require no format
				'**/.vite-inspect/**',
				'packages/e2e-tests/_test_dependencies/**/*.svelte' // TODO remove after sourcemap bug is fixed
			],
			options: {
				rangeEnd: 0
			}
		},
		{
			files: ['**/package.json', '**/README.md', 'docs/**/*.md', '.changeset/pre.json'],
			options: {
				useTabs: false,
				tabWidth: 2
			}
		}
	]
};
