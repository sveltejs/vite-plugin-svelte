import { createRequire } from 'module';
import { Plugin } from 'vite';
import { log } from '../../utils/log';
export function svelteInspector(): Plugin {
	let require: NodeRequire;
	return {
		name: 'vite-plugin-svelte:inspector',
		apply: 'serve',
		enforce: 'pre',

		configResolved(config) {
			require = createRequire(config.root || process.cwd());
		},

		resolveId(importee: string, importer, options) {
			if (options?.ssr) {
				return;
			}
			if (importee.startsWith('virtual:svelte-inspector:')) {
				// this is needed because the plugin itself is not a dependency of the app so regular resolve may not find it
				const file = importee.replace(
					'virtual:svelte-inspector:',
					'@sveltejs/vite-plugin-svelte/src/ui/inspector/'
				);
				const path = require.resolve(file);
				if (path) {
					return path;
				} else {
					log.error.once(`failed to resolve ${file} for ${importee}`);
				}
			}
		},

		transformIndexHtml(html) {
			return {
				html,
				tags: [
					{
						tag: 'script',
						injectTo: 'body',
						attrs: {
							type: 'module',
							// /@id/ is needed, otherwise the virtual: is seen as protocol by browser and cors error happens
							src: '/@id/virtual:svelte-inspector:load-inspector.ts'
						}
					}
				]
			};
		}
	};
}
