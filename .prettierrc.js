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
			files: ['**/CHANGELOG.md', '.github/renovate.json5'],
			options: {
				requirePragma: true
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
