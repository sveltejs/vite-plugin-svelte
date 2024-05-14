export const VITE_RESOLVE_MAIN_FIELDS = ['browser', 'module', 'jsnext:main', 'jsnext'];

export const SVELTE_RESOLVE_MAIN_FIELDS = ['svelte'];

export const SVELTE_IMPORTS = [
	'svelte/animate',
	'svelte/easing',
	'svelte/internal',
	'svelte/internal/disclose-version',
	'svelte/motion',
	'svelte/store',
	'svelte/transition',
	'svelte/server',
	'svelte/internal/server',
	'svelte/legacy',
	'svelte'
];

export const SVELTE_EXPORT_CONDITIONS = ['svelte'];

export const FAQ_LINK_MISSING_EXPORTS_CONDITION =
	'https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#missing-exports-condition';

export const DEFAULT_SVELTE_EXT = ['.svelte'];
export const DEFAULT_SVELTE_MODULE_INFIX = ['.svelte.'];
export const DEFAULT_SVELTE_MODULE_EXT = ['.js', '.ts'];
