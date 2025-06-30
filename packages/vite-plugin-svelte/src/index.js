import process from 'node:process';
import { log } from './utils/log.js';
import { configure } from './plugins/configure.js';
import { preprocess } from './plugins/preprocess.js';
import { compile } from './plugins/compile.js';
import { loadCompiledCss } from './plugins/load-compiled-css.js';
import { setupOptimizer } from './plugins/setup-optimizer.js';
import { compileModule } from './plugins/compile-module.js';
import { svelteInspector } from '@sveltejs/vite-plugin-svelte-inspector';
import { loadCustom } from './plugins/load-custom.js';
import { hotUpdate } from './plugins/hot-update.js';

/**
 * returns a list of plugins to handle svelte files
 * plugins are named `vite-plugin-svelte:<task>`
 *
 * @param {Partial<import('./public.d.ts').Options>} [inlineOptions]
 * @returns {import('vite').Plugin[]}
 */
export function svelte(inlineOptions) {
	if (process.env.DEBUG != null) {
		log.setLevel('debug');
	}
	/** @type {import('./types/plugin-api.js').PluginAPI} */
	// @ts-expect-error initialize empty to guard against early use
	const api = {}; // initialized by configure plugin, used in others
	return [
		{ name: 'vite-plugin-svelte' }, // marker for detection logic in other plugins that expect this name
		configure(api, inlineOptions),
		setupOptimizer(api),
		loadCompiledCss(api),
		loadCustom(api),
		preprocess(api),
		compile(api),
		compileModule(api),
		hotUpdate(api),
		svelteInspector()
	];
}

export { vitePreprocess } from './preprocess.js';
export { loadSvelteConfig } from './utils/load-svelte-config.js';
