import { Plugin, normalizePath } from 'vite';
import { log } from '../../utils/log';
import { InlineEditorOptions, InspectorOptions } from '../../utils/options';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { idToFile } from '../inspector/utils';
import type { VitePluginSvelteAPI } from '../../index';

const defaultInspectorOptions: InspectorOptions = {
	toggleKeyCombo: process.platform === 'win32' ? 'control-<' : 'meta-<',
	holdMode: false,
	showToggleButton: 'active',
	toggleButtonPos: 'bottom-right',
	customStyles: true
};

function getInlineEditorPath() {
	const pluginPath = normalizePath(path.dirname(fileURLToPath(import.meta.url)));
	return pluginPath.replace(
		/\/vite-plugin-svelte\/dist$/,
		'/vite-plugin-svelte/src/ui/inline-editor/'
	);
}

export function svelteInlineEditor(): Plugin {
	const inlineEditorPath = getInlineEditorPath();
	log.debug.enabled && log.debug(`svelte inlineEditor path: ${inlineEditorPath}`);
	let inlineEditorOptions: InlineEditorOptions;
	let appendTo: string | undefined;
	let disabled = false;
	let api: VitePluginSvelteAPI;

	return {
		name: 'vite-plugin-svelte:inline-editor',
		apply: 'serve',
		enforce: 'pre',

		configResolved(config) {
			const vps = config.plugins.find((p) => p.name === 'vite-plugin-svelte');
			if (!vps?.api?.options?.experimental?.inlineEditor) {
				log.debug('inlineEditor disabled, could not find config');
				disabled = true;
				return;
			}
			api = vps.api;
			const opts = api.options.experimental!.inlineEditor!;
			if (opts === true) {
				inlineEditorOptions = {
					...defaultInspectorOptions
				};
			} else {
				inlineEditorOptions = {
					...defaultInspectorOptions,
					...inlineEditorOptions
				};
			}
			if (vps.api.options.kit && !inlineEditorOptions.appendTo) {
				const out_dir = vps.api.options.kit.outDir || '.svelte-kit';
				inlineEditorOptions.appendTo = `${out_dir}/generated/root.svelte`;
			}
			appendTo = inlineEditorOptions.appendTo;
		},

		configureServer(server) {
			const root = server.config.root;
			server.ws.on('svelte-inline-editor:start', (meta, client) => {
				try {
					const filePath = path.resolve(root, meta.loc.file);
					// TODO ensure it is inside vite root or fs.allow to prevent data leaks on accessible dev servers
					const content = fs.readFileSync(filePath, 'utf-8');
					client.send('svelte-inline-editor:edit', { loc: meta.loc, content });
				} catch (e) {
					log.error(`failed to send content of ${meta.loc.file} to browser via ws`, e);
				}
			});
			const { compileSvelte, requestParser, options } = api;
			server.ws.on('svelte-inline-editor:save', (data) => {
				const { code, content, file } = data;
				try {
					const filePath = path.resolve(root, file);
					// TODO ensure it is inside vite root or fs.allow to prevent data loss/inject on accessible dev servers
					const diskContent = fs.readFileSync(filePath, 'utf-8');
					if (content === diskContent) {
						// file has not changed
						// try to compile the new code
						compileSvelte(requestParser(file, false)!, code, options)
							.then(() => {
								// did compile, write to disk
								fs.writeFileSync(file, code, 'utf-8');
								server.ws.send('svelte-inline-editor:saved', { file, code });
							})
							.catch((error) => {
								log.error(`failed to compile ${file}`, error);
								server.ws.send('svelte-inline-editor:error', { file, error, code, content });
							});
					} else {
						log.warn(
							`${file} has changed on disk between starting edit in browser and now, aborting save`
						);
					}
				} catch (e) {
					log.error(`failed to save content of ${file} to file system via ws`, e);
				}
			});
		},

		async resolveId(importee: string, importer, options) {
			if (options?.ssr || disabled) {
				return;
			}
			if (importee.startsWith('virtual:svelte-inline-editor-options')) {
				return importee;
			} else if (importee.startsWith('virtual:svelte-inline-editor-path:')) {
				const resolved = importee.replace('virtual:svelte-inline-editor-path:', inlineEditorPath);
				log.debug.enabled && log.debug(`resolved ${importee} with ${resolved}`);
				return resolved;
			}
		},

		async load(id, options) {
			if (options?.ssr || disabled) {
				return;
			}
			if (id === 'virtual:svelte-inline-editor-options') {
				return `export default ${JSON.stringify(inlineEditorOptions ?? {})}`;
			} else if (id.startsWith(inlineEditorPath)) {
				// read file ourselves to avoid getting shut out by vites fs.allow check
				const file = idToFile(id);
				if (fs.existsSync(file)) {
					return await fs.promises.readFile(file, 'utf-8');
				} else {
					log.error(`failed to find file for svelte-inspector: ${file}, referenced by id ${id}.`);
				}
			}
		},

		transform(code: string, id: string, options?: { ssr?: boolean }) {
			if (options?.ssr || disabled || !appendTo) {
				return;
			}
			if (id.endsWith(appendTo)) {
				return {
					code: `${code}\nimport 'virtual:svelte-inline-editor-path:load-inline-editor.js'`
				};
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
							src: '/@id/virtual:svelte-inline-editor-path:load-inline-editor.js'
						}
					}
				]
			};
		}
	};
}
