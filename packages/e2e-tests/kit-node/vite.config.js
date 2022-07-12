// eslint-disable-next-line node/no-missing-import
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
	ssr: {
		// TODO this is needed otherwise tests fail. investigate
		noExternal: ['e2e-test-dep-svelte-api-only']
	},
	plugins: [transformValidation(), sveltekit()]
};

export default config;
