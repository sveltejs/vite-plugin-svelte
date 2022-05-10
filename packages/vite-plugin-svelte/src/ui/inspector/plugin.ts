import { Plugin } from 'vite';
import { log } from '../../utils/log';
import { InspectorOptions } from '../../utils/options';

const defaultInspectorOptions: InspectorOptions = {
	toggleKeyCombo: process.platform === 'win32' ? 'control-shift' : 'meta-shift',
	holdMode: false,
	showToggleButton: 'active',
	toggleButtonPos: 'top-right',
	customStyles: true
};

export function svelteInspector(): Plugin {
	let inspectorOptions: InspectorOptions;
	let append_to: string | undefined;
	let inspector_path: string;
	let disabled = false;

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
				disabled = true;
			} else {
				if (vps.api.options.kit && !inspectorOptions.appendTo) {
					const out_dir = vps.api.options.kit.outDir || '.svelte-kit';
					inspectorOptions.appendTo = `${out_dir}/runtime/client/start.js`;
				}
				append_to = inspectorOptions.appendTo;
			}
		},

		async resolveId(importee: string, importer, options) {
			if (options?.ssr || disabled) {
				return;
			}
			if (!inspector_path) {
				try {
					// @ts-ignore
					const plugin_path = (
						await this.resolve('@sveltejs/vite-plugin-svelte/package.json', undefined, {
							skipSelf: true
						})
					).id
						.replace(/\/package\.json$/, '')
						.replace(/^\//, '');
					inspector_path = `/@fs/${plugin_path}/src/ui/inspector/`;
					log.debug(`resolved inspector path to ${inspector_path}`);
				} catch (e) {
					log.error(
						'failed to resolve @sveltejs/vite-plugin-svelte path, disabling svelte inspector.'
					);
					log.debug.enabled && log.debug('resolve @sveltejs/vite-plugin-svelte error', e);
					disabled = true;
					return;
				}
			}
			if (importee.startsWith('virtual:svelte-inspector-options')) {
				return importee;
			} else if (importee.startsWith('virtual:svelte-inspector-path:')) {
				return importee.replace('virtual:svelte-inspector-path:', inspector_path);
			}
		},

		load(id, options) {
			if (options?.ssr || disabled) {
				return;
			}
			if (id === 'virtual:svelte-inspector-options') {
				return `export default ${JSON.stringify(inspectorOptions ?? {})}`;
			}
		},

		transform(code: string, id: string, options?: { ssr?: boolean }) {
			if (options?.ssr || disabled || !append_to) {
				return;
			}
			if (id.endsWith(append_to)) {
				return { code: `${code}\nimport '${inspector_path}load-inspector.js'` };
			}
		},
		transformIndexHtml(html) {
			if (disabled || append_to) {
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
							src: `${inspector_path}load-inspector.js`
						}
					}
				]
			};
		}
	};
}
