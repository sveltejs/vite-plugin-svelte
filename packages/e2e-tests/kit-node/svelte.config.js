import node from '@sveltejs/adapter-node';
import { transformValidation } from 'e2e-test-dep-vite-plugins';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// By default, `npm run build` will create a standard Node app.
		// You can create optimized builds for different platforms by
		// specifying a different adapter
		adapter: node(),

		vite: {
			ssr: {
				// TODO this is needed otherwise tests fail. investigate
				noExternal: ['e2e-test-dep-svelte-api-only']
			},
			server: {
				watch: {
					// During tests we edit the files too fast and sometimes chokidar
					// misses change events, so enforce polling for consistency
					usePolling: true,
					interval: 100
				}
			},
			plugins: [transformValidation()]
		}
	}
};
export default config;
