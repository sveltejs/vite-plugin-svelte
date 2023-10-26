import { isSvelte5 } from './svelte-version.js';

export const VITE_RESOLVE_MAIN_FIELDS = ['module', 'jsnext:main', 'jsnext'];

export const SVELTE_RESOLVE_MAIN_FIELDS = ['svelte'];

export const SVELTE_IMPORTS = [
	'svelte/animate',
	'svelte/easing',
	'svelte/internal',
	'svelte/ssr',
	'svelte/store',
	'svelte/transition',
	'svelte'
];

if (!isSvelte5) {
	// TODO add back to list above once it's part of svelte5
	SVELTE_IMPORTS.push('svelte/internal/disclose-version', 'svelte/motion');
}
export const SVELTE_HMR_IMPORTS = [
	'svelte-hmr/runtime/hot-api-esm.js',
	'svelte-hmr/runtime/proxy-adapter-dom.js',
	'svelte-hmr'
];

export const SVELTE_EXPORT_CONDITIONS = ['svelte'];

export const FAQ_LINK_MISSING_EXPORTS_CONDITION =
	'https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#missing-exports-condition';
