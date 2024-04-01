import { isSvelte4 } from './svelte-version.js';

export const VITE_RESOLVE_MAIN_FIELDS = ['browser', 'module', 'jsnext:main', 'jsnext'];

export const SVELTE_RESOLVE_MAIN_FIELDS = ['svelte'];

export const SVELTE_OPTIMIZEDEPS = ['svelte/**/*.js', 'svelte'];

if (isSvelte4) {
	SVELTE_OPTIMIZEDEPS.push('svelte-hmr/**/*.js');
}

export const SVELTE_DEDUPE = ['svelte'];
if (isSvelte4) {
	SVELTE_DEDUPE.push('svelte-hmr');
}
export const SVELTE_EXPORT_CONDITIONS = ['svelte'];

export const FAQ_LINK_MISSING_EXPORTS_CONDITION =
	'https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#missing-exports-condition';
