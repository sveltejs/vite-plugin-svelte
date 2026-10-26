import node from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { transformValidation, writeResolvedConfig } from 'e2e-test-dep-vite-plugins';

/** @type {import('vite').UserConfig} */
export default {
	server: {
		watch: {
			// During tests we edit the files too fast and sometimes chokidar
			// misses change events, so enforce polling for consistency
			usePolling: true,
			interval: 100
		}
	},
	build: {
		minify: false,
		sourcemap: true // must be true for hermetic build test!
	},
	plugins: [
		transformValidation(),
		sveltekit({ preprocess: vitePreprocess(), adapter: node() }),
		writeResolvedConfig()
	],
	optimizeDeps: {
		// eagerly include these, otherwise vite optimizer might interfere with restarting while the test is running
		include: ['svelte-i18n', 'e2e-test-dep-svelte-api-only']
	},
	css: {
		postcss: {
			plugins: [{ postcssPlugin: 'noop' }]
		}
	}
};
