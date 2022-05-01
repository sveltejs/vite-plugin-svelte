import { createRequire } from 'module';
import { Plugin } from 'vite';
import { log } from '../../utils/log';
export interface InspectorOptions {
	appendTo?: string;
	modifierKey?: string;
}
export function svelteInspector(): Plugin {
	let require: NodeRequire;
	let inspectorOptions: InspectorOptions;
	let append_to: string | undefined;

	return {
		name: 'vite-plugin-svelte:inspector',
		apply: 'serve',
		enforce: 'pre',

		configResolved(config) {
			const vps = config.plugins.find((p) => p.name === 'vite-plugin-svelte');
			if (!vps || vps.api?.options?.inspector === false) {
				// disabled, turn all hooks into noops
				this.resolveId = this.load = this.transformIndexHtml = this.transform = () => {};
			} else {
				require = createRequire(config.root || process.cwd());
				append_to = inspectorOptions?.appendTo;
			}
		},

		resolveId(importee: string, importer, options) {
			if (options?.ssr) {
				return;
			}
			if (importee === 'virtual:svelte-inspector-options') {
				return importee;
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
		load(id) {
			if (id === 'virtual:svelte-inspector-options') {
				return `export default ${JSON.stringify(inspectorOptions ?? {})}`;
			}
		},
		transform(code: string, id: string, options?: { ssr?: boolean }) {
			if (options?.ssr || !append_to) {
				return;
			}
			if (id.endsWith(append_to)) {
				return { code: `${code}\nimport 'virtual:svelte-inspector:load-inspector.ts'` };
			}
		},
		transformIndexHtml(html) {
			if (append_to) {
				return;
			}
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
