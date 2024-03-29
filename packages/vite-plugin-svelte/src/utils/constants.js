import { isSvelte4 } from './svelte-version.js';
import { createRequire } from 'node:module';

export const VITE_RESOLVE_MAIN_FIELDS = ['browser', 'module', 'jsnext:main', 'jsnext'];

export const SVELTE_RESOLVE_MAIN_FIELDS = ['svelte'];

export const SVELTE_IMPORTS = Object.entries(
	createRequire(import.meta.url)('svelte/package.json').exports
)
	.map(([name, config]) => {
		// ignore type only
		if (typeof config === 'object' && Object.keys(config).length === 1 && config.types) {
			return '';
		}
		// ignore names
		if (name === './package.json' || name === './compiler') {
			return '';
		}
		return name.replace(/^\./, 'svelte');
	})
	.filter((s) => s.length > 0);

// svelte-hmr isn't used with svelte5
export const SVELTE_HMR_IMPORTS = isSvelte4
	? ['svelte-hmr/runtime/hot-api-esm.js', 'svelte-hmr/runtime/proxy-adapter-dom.js', 'svelte-hmr']
	: [];

export const SVELTE_EXPORT_CONDITIONS = ['svelte'];

export const FAQ_LINK_MISSING_EXPORTS_CONDITION =
	'https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#missing-exports-condition';
