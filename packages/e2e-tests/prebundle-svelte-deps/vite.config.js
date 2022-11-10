import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
	optimizeDeps: {
		// TODO this must be excluded because nested has an scss dep that prebundle can't handle!
		// figure out how to exclude it automatically or at least tell the user about it in a more friendly way
		exclude: ['e2e-test-dep-svelte-nested'],
		include: [
			// TODO without this, it fails for module.exports in the browser.
			//   shouldn't prebundling take care of it?
			'e2e-test-dep-svelte-hybrid > e2e-test-dep-cjs-only'
		]
	},
	build: {
		// make build faster by skipping transforms and minification
		target: 'esnext',
		minify: false
	}
});
