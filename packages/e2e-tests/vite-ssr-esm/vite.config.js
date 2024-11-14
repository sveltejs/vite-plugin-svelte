import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ command, mode }) => {
	return {
		plugins: [svelte()],
		build: {
			target: 'esnext',
			minify: false,
			assetsInlineLimit: 0,
			rollupOptions: {
				output: {
					format: 'esm'
				}
			}
		},
		// Because `esm-env` is used by Svelte to determine running in dev mode, and that package
		// uses `development` condition to determine so in dev. And on the other hand, Vite uses
		// `process.env.NODE_ENV` to determine dev mode, which v-p-s passes to `compilerOptions.dev`,
		// there's a potential mismatch of dev condition that Svelte doesn't expect, causing a runtime
		// error at https://github.com/sveltejs/svelte/blob/53af138d588f77bb8f4f10f9ad15fd4f798b50ef/packages/svelte/src/internal/server/dev.js#L70
		// TODO: Figure out if either:
		// 1. Svelte should work resiliently with mismatch dev/prod modes.
		// 2. We hardcode `ssr.noExternal: ['esm-env']` in v-p-s directly, however we're not resolving the root cause.
		// 3. We crawl recursively for `esm-env` to resolve no2, but still kinda hacky.
		// 4. Encourage users to set `NODE_OPTIONS="--conditions development"` when running vite dev.
		// 5. Vite should revert it's external resolve logic, however we're also not resolving the root cause.
		// ... or something else
		ssr: {
			noExternal: ['esm-env']
		},
		server: {
			watch: {
				// During tests we edit the files too fast and sometimes chokidar
				// misses change events, so enforce polling for consistency
				usePolling: true,
				interval: 100
			}
		}
	};
});
