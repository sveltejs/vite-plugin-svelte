import { Plugin, normalizePath } from 'vite';
import { log } from '../../utils/log';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { idToFile } from './utils';
import { defaultInspectorOptions, type InspectorOptions, parseEnvironmentOptions } from './options';

function getInspectorPath() {
	const pluginPath = normalizePath(path.dirname(fileURLToPath(import.meta.url)));
	return pluginPath.replace(/\/vite-plugin-svelte\/dist$/, '/vite-plugin-svelte/src/ui/inspector/');
}

export function svelteInspector(): Plugin {
	const inspectorPath = getInspectorPath();
	log.debug.enabled && log.debug(`svelte inspector path: ${inspectorPath}`);
	let inspectorOptions: InspectorOptions;
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
				return;
			}
			const configFileOptions = vps?.api?.options?.inspector;
			const environmentOptions = parseEnvironmentOptions(config);
			if (!configFileOptions && !environmentOptions) {
				log.debug('no options found, inspector disabled', undefined, 'inspector');
				disabled = true;
				return;
			}
			if (environmentOptions === true) {
				inspectorOptions = defaultInspectorOptions;
			} else {
				inspectorOptions = {
					...defaultInspectorOptions,
					...configFileOptions,
					...(environmentOptions || {})
				};
			}
			inspectorOptions.__internal = {
				base: config.base?.replace(/\/$/, '') || ''
			};
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

		transform(code, id, options) {
			if (options?.ssr || disabled) {
				return;
			}
			if (id.includes('vite/dist/client/client.mjs')) {
				return { code: `${code}\nimport('virtual:svelte-inspector-path:load-inspector.js')` };
			}
		}
	};
}
