import { createRequire } from 'node:module';

/** @type {import('svelte/package.json')} */
const sveltePkg = createRequire(import.meta.url)('svelte/package.json');

// list of svelte runtime dependencies to optimize together with svelte itself
export const SVELTE_RUNTIME_DEPENDENCIES = /** @type {const} */ ([
	'clsx' // avoids dev server restart after page load with npm + vite6 (see #1067)
]).filter((dep) => !!sveltePkg.dependencies?.[dep]);

const SVELTE_IMPORTS = Object.entries(sveltePkg.exports)
	.filter(([name, config]) => {
		// ignore names
		if (name === './package.json') {
			return '';
		}

		// ignore type only
		return !(
			typeof config === 'object' &&
			Object.keys(config).length === 1 &&
			'types' in config &&
			config.types
		);
	})
	.map(([name, config]) => {
		return { name: name.replace(/^\./, 'svelte'), config };
	});

export const SVELTE_DEDUPED_IMPORTS = SVELTE_IMPORTS.map(({ name }) => {
	if (name === 'svelte/compiler') {
		return '';
	}
	return name;
}).filter((s) => s.length > 0);

export const SVELTE_CLIENT_IMPORTS = SVELTE_IMPORTS.map(({ name }) => {
	// ignore names
	if (name === 'svelte/compiler' || name.endsWith('/server') || name.includes('/server/')) {
		return '';
	}

	return name;
}).filter((s) => s.length > 0);

export const SVELTE_SERVER_IMPORTS = SVELTE_IMPORTS.map(({ name, config }) => {
	// ignore non-server imports
	if (
		!(name.endsWith('/server') || name.includes('/server/')) &&
		((typeof config === 'object' && !('worker' in config)) || typeof config === 'string')
	) {
		return '';
	}
	return name;
}).filter((s) => s.length > 0);

export const SVELTE_EXPORT_CONDITIONS = ['svelte'];

const FAQ_URL = 'https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md';
export const FAQ_LINK_MISSING_EXPORTS_CONDITION = `${FAQ_URL}#missing-exports-condition`;
export const FAQ_LINK_CSSHASH = `${FAQ_URL}#why-should-csshash-be-calculated-from-filename-during-dev`;

export const LINK_TRANSFORM_WITH_PLUGIN =
	'https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/advanced-usage.md#transform-svelte-files-with-vite-plugins';

export const DEFAULT_SVELTE_EXT = ['.svelte'];
export const DEFAULT_SVELTE_MODULE_INFIX = ['.svelte.'];
export const DEFAULT_SVELTE_MODULE_EXT = ['.js', '.ts'];

export const SVELTE_VIRTUAL_STYLE_ID_REGEX = /[?&]svelte&type=style&lang.css$/;
