# @sveltejs/vite-plugin-svelte

## usage

```js
// vite.config.js
const svelte = require('@sveltejs/vite-plugin-svelte');
const { defineConfig } = require('vite');

module.exports = defineConfig(({ command, mode }) => {
	const isProduction = mode === 'production';
	return {
		plugins: [
			svelte({
				/* inline options here */
			})
		],
		build: {
			minify: isProduction
		}
	};
});
```

## Options

vite-plugin-svelte reads the vite configuration and uses an appropriate default configuration

It also loads `svelte.config.js` (or `svelte.config.cjs`) from the configured `vite.root` directory automatically.

Options are applied in the following order:

1. vite-plugin-svelte defaults
2. svelte.config.js in vite.root
3. inline options passed in vite.config.js

It supports all options from rollup-plugin-svelte and some additional options to tailor the plugin to your needs.

For more Information check [options.ts](src/utils/options.ts)

## License

MIT
