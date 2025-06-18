import { config } from './plugins/config.js';
import { preprocess } from './plugins/preprocess.js';
import { compile } from './plugins/compile.js';
import { externalCss } from './plugins/external-css.js';
import { optimize } from './plugins/optimize.js';
import { optimizeModule } from './plugins/optimize-module.js';
import { compileModule } from './plugins/compile-module.js';
import { svelteInspector } from '@sveltejs/vite-plugin-svelte-inspector';
/**
 * returns a list of plugins to handle svelte files
 * plugins are named `vite-plugin-svelte:<task>`
 *
 * @param {Partial<import('./public.d.ts').Options>} [inlineOptions]
 * @returns {import('vite').Plugin[]}
 */
export function svelte(inlineOptions) {
	return [
		config(inlineOptions), // parse config and put it on api.__internal for the other plugins to use
		optimize(), // create optimize plugin
		preprocess(), // preprocess .svelte files
		compile(), // compile .svelte files
		externalCss(), // return vitrual css modules created by compile
		optimizeModule(), // create optimize module plugin
		compileModule(),// compile module
		svelteInspector()
	];
}

export { vitePreprocess } from './preprocess.js';
export { loadSvelteConfig } from './utils/load-svelte-config.js';
