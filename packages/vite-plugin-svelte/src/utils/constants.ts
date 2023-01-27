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

export const SVELTE_HMR_IMPORTS = [
	'svelte-hmr/runtime/hot-api-esm.js',
	'svelte-hmr/runtime/proxy-adapter-dom.js',
	'svelte-hmr'
];

export const SVELTE_EXPORT_CONDITIONS = ['svelte'];
