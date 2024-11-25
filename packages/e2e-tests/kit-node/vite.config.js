import { sveltekit } from '@sveltejs/kit/vite';
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
		sveltekit(),
		writeResolvedConfig(),
		workaroundInlineSvelteCssIssue()
	],
	optimizeDeps: {
		// eagerly include these, otherwise vite optimizer might interfere with restarting while the test is running
		include: ['svelte-i18n', 'e2e-test-dep-svelte-api-only']
	}
};

/**
 * Workaround until https://github.com/sveltejs/kit/pull/13007 is merged
 * @returns {import('vite').Plugin}
 */
function workaroundInlineSvelteCssIssue() {
	return {
		name: 'workaround-inline-svelte-css-issue',
		enforce: 'pre',
		resolveId(id) {
			// SvelteKit relies on a previous behaviour in v-p-s where it strips out the inline
			// query to get the CSS result, however this no longer works in Vite 6 and should be
			// fixed in SvelteKit instead, otherwise FOUC will happen in dev.
			if (id.includes('?svelte')) {
				return id.replace(/&inline=$/, '');
			}
		}
	};
}
