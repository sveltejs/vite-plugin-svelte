import { Plugin, normalizePath } from 'vite';
import { log } from '../../utils/log';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { idToFile } from './utils';
import { defaultInspectorOptions, type InspectorOptions } from './options';

function getInspectorPath() {
	const pluginPath = normalizePath(path.dirname(fileURLToPath(import.meta.url)));
	return pluginPath.replace(/\/vite-plugin-svelte\/dist$/, '/vite-plugin-svelte/src/ui/inspector/');
}

export function svelteInspector(): Plugin {
	const inspectorPath = getInspectorPath();
	log.debug.enabled && log.debug(`svelte inspector path: ${inspectorPath}`);
	let inspectorOptions: InspectorOptions;
	let appendTo: string | undefined;
	let disabled = false;

	return {
		name: 'vite-plugin-svelte:inspector',
		apply: 'serve',
		enforce: 'pre',

		configResolved(config) {
			const vps = config.plugins.find((p) => p.name === 'vite-plugin-svelte');
			if (!vps) {
				log.warn('vite-plugin-svelte is missing, inspector disabled', undefined, 'inspector');
				disabled = true;
			}
			const options = vps?.api?.options?.inspector ?? defaultInspectorOptions;
			if (options === false) {
				log.debug('inspector disabled in options', undefined, 'inspector');
				disabled = true;
			}
			if (disabled) {
				return;
			}
			inspectorOptions = {
				...defaultInspectorOptions,
				...options
			};
			const isSvelteKit = config.plugins.some((p) => p.name.startsWith('vite-plugin-sveltekit'));
			if (isSvelteKit && !inspectorOptions.appendTo) {
				// this could append twice if a user had a file that ends with /generated/root.svelte
				// but that should be rare and inspector doesn't execute twice
				inspectorOptions.appendTo = `/generated/root.svelte`;
			}
			appendTo = inspectorOptions.appendTo;
		},

		async resolveId(importee: string, importer, options) {
			if (options?.ssr || disabled) {
				return;
			}
			if (importee.startsWith('virtual:svelte-inspector-options')) {
				return importee;
			} else if (importee.startsWith('virtual:svelte-inspector-path:')) {
				const resolved = importee.replace('virtual:svelte-inspector-path:', inspectorPath);
				log.debug.enabled &&
					log.debug(`resolved ${importee} with ${resolved}`, undefined, 'inspector');
				return resolved;
			}
		},

		async load(id, options) {
			if (options?.ssr || disabled) {
				return;
			}
			if (id === 'virtual:svelte-inspector-options') {
				return `export default ${JSON.stringify(inspectorOptions ?? {})}`;
			} else if (id.startsWith(inspectorPath)) {
				// read file ourselves to avoid getting shut out by vites fs.allow check
				const file = idToFile(id);
				if (fs.existsSync(file)) {
					return await fs.promises.readFile(file, 'utf-8');
				} else {
					log.error(
						`failed to find file for svelte-inspector: ${file}, referenced by id ${id}.`,
						undefined,
						'inspector'
					);
				}
			}
		},

		transform(code: string, id: string, options?: { ssr?: boolean }) {
			if (options?.ssr || disabled || !appendTo) {
				return;
			}
			if (id.endsWith(appendTo)) {
				return { code: `${code}\nimport 'virtual:svelte-inspector-path:load-inspector.js'` };
			}
		},
		transformIndexHtml(html) {
			if (disabled || appendTo) {
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
							src: '/@id/virtual:svelte-inspector-path:load-inspector.js'
						}
					}
				]
			};
		}
	};
}
