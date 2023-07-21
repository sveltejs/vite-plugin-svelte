import { isSvelte3 } from './svelte-version.js';

export const VITE_RESOLVE_MAIN_FIELDS = ['module', 'jsnext:main', 'jsnext'];

export const SVELTE_RESOLVE_MAIN_FIELDS = ['svelte'];

export const SVELTE_IMPORTS = [
	'svelte/animate',
	'svelte/easing',
	'svelte/internal',
	'svelte/motion',
	'svelte/ssr',
	'svelte/store',
	'svelte/transition',
	'svelte'
];
// TODO add to global list after dropping svelte 3
if (!isSvelte3) {
	SVELTE_IMPORTS.push('svelte/internal/disclose-version');
}

export const SVELTE_HMR_IMPORTS = [
	'svelte-hmr/runtime/hot-api-esm.js',
	'svelte-hmr/runtime/proxy-adapter-dom.js',
	'svelte-hmr'
];

export const SVELTE_EXPORT_CONDITIONS = ['svelte'];

export const FAQ_LINK_CONFLICTS_IN_SVELTE_RESOLVE =
	'https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#conflicts-in-svelte-resolve';
