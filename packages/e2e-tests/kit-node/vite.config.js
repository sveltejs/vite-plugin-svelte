import { sveltekit } from '@sveltejs/kit/vite';
import { transformValidation } from 'e2e-test-dep-vite-plugins';

/** @type {import('vite').UserConfig} */
const config = {
	server: {
		watch: {
			// During tests we edit the files too fast and sometimes chokidar
			// misses change events, so enforce polling for consistency
			usePolling: true,
			interval: 100
		}
	},
	build: {
		minify: false
	},
	plugins: [transformValidation(), sveltekit()],
	optimizeDeps: {
		// eagerly include these, otherwise vite optimizer might interfere with restarting while the test is running
		include: ['svelte-i18n', 'e2e-test-dep-svelte-api-only']
	}
};

export default config;
