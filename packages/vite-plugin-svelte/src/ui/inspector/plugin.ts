import { Plugin, normalizePath } from 'vite';
import { log } from '../../utils/log';
import { InspectorOptions } from '../../utils/options';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { idToFile } from './utils';

const defaultInspectorOptions: InspectorOptions = {
	toggleKeyCombo: process.platform === 'win32' ? 'control-shift' : 'meta-shift',
	navKeys: { parent: 'ArrowUp', child: 'ArrowDown', next: 'ArrowRight', prev: 'ArrowLeft' },
	openKey: 'Enter',
	holdMode: false,
	showToggleButton: 'active',
	toggleButtonPos: 'top-right',
	customStyles: true
};

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
			const options = vps?.api?.options?.experimental?.inspector;
			if (!vps || !options) {
				log.debug('inspector disabled, could not find config');
				disabled = true;
				return;
			}
			inspectorOptions = {
				...defaultInspectorOptions,
				...options
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
				log.debug.enabled && log.debug(`resolved ${importee} with ${resolved}`);
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
					log.error(`failed to find file for svelte-inspector: ${file}, referenced by id ${id}.`);
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
