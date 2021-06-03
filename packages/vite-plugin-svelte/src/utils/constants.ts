const VITE_RESOLVE_MAIN_FIELDS = ['module', 'jsnext:main', 'jsnext'];

export const SVELTE_RESOLVE_MAIN_FIELDS = ['svelte', ...VITE_RESOLVE_MAIN_FIELDS];

export const SVELTE_IMPORTS = [
	'svelte/animate',
	'svelte/easing',
	'svelte/internal',
	'svelte/motion',
	'svelte/store',
	'svelte/transition',
	'svelte',
	'svelte-hmr/runtime/hot-api-esm.js',
	'svelte-hmr/runtime/proxy-adapter-dom.js',
	'svelte-hmr'
];

export const SVELTE_VITE_ASSETS_EXTENSIONS = ['.svg'];
