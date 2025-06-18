import { configure } from './plugins/configure.js';
import { preprocess } from './plugins/preprocess.js';
import { compile } from './plugins/compile.js';
import { loadCompiledCss } from './plugins/load-compiled-css.js';
import { setupOptimizer } from './plugins/setup-optimizer.js';
import { optimizeModule } from './plugins/optimize-module.js';
import { compileModule } from './plugins/compile-module.js';
import { svelteInspector } from '@sveltejs/vite-plugin-svelte-inspector';
import {loadCustom} from "./plugins/load-custom.js";
/**
 * returns a list of plugins to handle svelte files
 * plugins are named `vite-plugin-svelte:<task>`
 *
 * @param {Partial<import('./public.d.ts').Options>} [inlineOptions]
 * @returns {import('vite').Plugin[]}
 */
export function svelte(inlineOptions) {
	/** @type {import('./types/plugin-api.js').PluginAPI} */
	const api = {
		// @ts-expect-error protection against early use
		get options(){
			throw new Error('must not use configResolved')
		},
		// @ts-expect-error protection against early use
		get getEnvironmentState() {
			throw new Error('must not use before configResolved')
		}
	};
	return [
		configure(api,inlineOptions), // parse config and put it on api.__internal for the other plugins to use
		setupOptimizer(api), // add optimizer plugins for pre-bundling in development
		preprocess(api), // preprocess .svelte files
		compile(api), // compile .svelte files
		loadCompiledCss(api), // return virtual css modules created by compile
		loadCustom(api), // return custom output d
		compileModule(api),// compile module
		svelteInspector()
	];
}

export { vitePreprocess } from './preprocess.js';
export { loadSvelteConfig } from './utils/load-svelte-config.js';
