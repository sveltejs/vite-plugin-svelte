import { createRequire } from 'module';
import { Plugin } from 'vite';
import { log } from '../../utils/log';
export interface InspectorOptions {
	/**
	 * key that must be held to keep inspector active
	 */
	holdKey?: string;
	/**
	 * define a key combo to toggle inspector,
	 * default: 'alt-s'
	 *
	 * must be a valid 2-key combo, eg ctrl-o shift-f alt-x
	 */
	toggleKeyCombo?: string;
	/**
	 * show button even when inspector is disabled
	 */
	showDisabledButton?: boolean;
	/**
	 * inject custom styles when inspector is active
	 */
	customStyles?: boolean;
	/**
	 * append an import to the module id ending with `appendTo` instead of adding a script into body
	 *
	 * useful for frameworks that do not support trannsformIndexHtml like SvelteKit
	 */
	appendTo?: string;
}

const defaultInspectorOptions: InspectorOptions = {
	holdKey: 's',
	toggleKeyCombo: 'alt-s',
	showDisabledButton: true,
	customStyles: true
};

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
			if (vps?.api?.options?.experimental?.inspector) {
				inspectorOptions = {
					...defaultInspectorOptions,
					...vps.api.options.experimental.inspector
				};
			}
			if (!vps || !inspectorOptions) {
				// disabled, turn all hooks into noops
				this.resolveId = this.load = this.transformIndexHtml = this.transform = () => {};
			} else {
				require = createRequire(config.root || process.cwd());
				if (vps.api.options.kit && !inspectorOptions.appendTo) {
					const out_dir = vps.api.options.kit.outDir || '.svelte-kit';
					inspectorOptions.appendTo = `${out_dir}/runtime/client/start.js`;
				}
				append_to = inspectorOptions.appendTo;
			}
		},

		async resolveId(importee: string, importer, options) {
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
