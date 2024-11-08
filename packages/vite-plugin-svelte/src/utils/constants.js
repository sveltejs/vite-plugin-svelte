import { createRequire } from 'node:module';

export const VITE_RESOLVE_MAIN_FIELDS = ['browser', 'module', 'jsnext:main', 'jsnext'];

// These two are required for Vite 6 only, as specifying conditions will remove the default ones,
// like the `mainFields` option. Vite 6 is working on exposing these which we can use later.
export const VITE_CLIENT_RESOLVE_CONDITIONS = ['module', 'browser', 'development|production'];
export const VITE_SERVER_RESOLVE_CONDITIONS = ['module', 'node', 'development|production'];

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

export const SVELTE_EXPORT_CONDITIONS = ['svelte'];

export const FAQ_LINK_MISSING_EXPORTS_CONDITION =
	'https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#missing-exports-condition';

export const DEFAULT_SVELTE_EXT = ['.svelte'];
export const DEFAULT_SVELTE_MODULE_INFIX = ['.svelte.'];
export const DEFAULT_SVELTE_MODULE_EXT = ['.js', '.ts'];
