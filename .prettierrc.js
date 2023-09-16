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
				'**/CHANGELOG.md',
				'.github/renovate.json5',
				'**/types/index.d.ts',
				'**/types/index.d.ts.map',
				'**/pnpm-lock.yaml'
			],
			options: {
				requirePragma: true
			}
		},
		{
			files: ['**/package.json', '**/README.md', 'docs/**/*.md'],
			options: {
				useTabs: false,
				tabWidth: 2
			}
		}
	]
};
