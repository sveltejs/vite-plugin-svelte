module.exports = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100,
	plugins: [require('prettier-plugin-svelte')],
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
				'**/vite.config.js.timestamp-*.mjs',
				'**/CHANGELOG.md',
				'.github/renovate.json5',
				'packages/e2e-tests/dynamic-compile-options/src/components/A.svelte'
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
