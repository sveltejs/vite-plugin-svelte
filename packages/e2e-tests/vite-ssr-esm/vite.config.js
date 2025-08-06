import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import process from 'node:process';
const isWatch = !!process.env.TEST_BUILD_WATCH;

export default defineConfig(({ command, mode }) => {
	return {
		plugins: [svelte()],
		environments: {
			client: {
				build: {
					rollupOptions: {
						output: {
							dir: 'dist/client'
						}
					}
				}
			},
			ssr: {
				build: {
					rollupOptions: {
						input: 'src/entry-server.js',
						output: {
							dir: 'dist/server'
						}
					}
				}
			}
		},
		build: {
			target: 'esnext',
			minify: false,
			assetsInlineLimit: 0,
			rollupOptions: {
				output: {
					format: 'esm'
				}
			},
			watch: isWatch ? {} : undefined
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
