/** @import { VitePreprocessOptions } from './public.js' */
/** @import { Preprocessor as SveltePreprocessor, PreprocessorGroup } from 'svelte/compiler' */
/** @import { InlineConfig, ResolvedConfig } from 'vite' */

import process from 'node:process';
import * as vite from 'vite';
import { mapToRelative, removeLangSuffix } from './utils/sourcemaps.js';
const {
	isCSSRequest,
	preprocessCSS,
	resolveConfig,
	//@ts-ignore rolldown types don't exist
	transformWithOxc
} = vite;
/**
 * @typedef {(code: string, filename: string) => Promise<{ code: string; map?: any; deps?: Set<string> }>} CssTransform
 */

const supportedScriptLangs = ['ts'];

export const lang_sep = '.vite-preprocess';

/**
 * @param {VitePreprocessOptions} [opts]
 * @returns {PreprocessorGroup}
 */
export function vitePreprocess(opts) {
	/** @type {PreprocessorGroup} */
	const preprocessor = { name: 'vite-preprocess' };
	if (opts?.script === true) {
		preprocessor.script = viteScript().script;
	}
	if (opts?.style !== false) {
		const styleOpts = typeof opts?.style == 'object' ? opts?.style : undefined;
		preprocessor.style = viteStyle(styleOpts).style;
	}
	return preprocessor;
}

/**
 * @returns {{ script: SveltePreprocessor }}
 */
function viteScript() {
	return {
		async script({ attributes, content, filename = '' }) {
			if (typeof attributes.lang !== 'string' || !supportedScriptLangs.includes(attributes.lang)) {
				return;
			}
			const lang = /** @type {'ts'} */ (attributes.lang);
			const { code, map } = await transformWithOxc(content, filename, {
				lang,
				target: 'esnext'
			});

			// oxc strips imports it considers unused, but some may be referenced in the Svelte
			// template which oxc cannot see. Detect stripped value imports and re-add them.
			const restoredCode = restoreStrippedImports(content, code);

			mapToRelative(map, filename);

			return {
				code: restoredCode,
				map
			};
		}
	};
}

/**
 * @typedef {{ kind: 'default' | 'named' | 'namespace', local: string, imported?: string }} ImportedId
 */

/**
 * Extracts imported value identifiers from an import statement.
 * Skips type-only specifiers (e.g., `type Foo` inside `import { type Foo, Bar }`).
 * @param {string} importStatement
 * @returns {{ ids: ImportedId[], source: string } | null}
 */
function getImportedIdentifiers(importStatement) {
	// skip `import type { ... }` or `import type Foo` entirely
	if (/\bimport\s+type\b/.test(importStatement)) return null;

	const sourceMatch = importStatement.match(/from\s+['"]([^'"]+)['"]/);
	if (!sourceMatch) return null;
	const source = sourceMatch[1];

	/** @type {ImportedId[]} */
	const ids = [];

	// default import: import Foo from '...'
	const defaultMatch = importStatement.match(/import\s+([A-Za-z_$][\w$]*)\s+from/);
	if (defaultMatch) ids.push({ kind: 'default', local: defaultMatch[1] });

	// named imports: import { a, b as c, type D } from '...'
	const namedMatch = importStatement.match(/import\s*(?:[A-Za-z_$][\w$]*\s*,\s*)?\{([^}]+)\}/);
	if (namedMatch) {
		for (const specifier of namedMatch[1].split(',')) {
			const trimmed = specifier.trim();
			if (!trimmed) continue;
			// skip type-only specifiers: `type Foo` or `type Foo as Bar`
			if (/^type\s+/.test(trimmed)) continue;
			const asMatch = trimmed.match(/^(\S+)\s+as\s+(\S+)$/);
			if (asMatch) {
				ids.push({ kind: 'named', imported: asMatch[1], local: asMatch[2] });
			} else {
				ids.push({ kind: 'named', local: trimmed });
			}
		}
	}

	// namespace import: import * as X from '...'
	const nsMatch = importStatement.match(/import\s*\*\s*as\s+(\S+)/);
	if (nsMatch) ids.push({ kind: 'namespace', local: nsMatch[1] });

	return ids.length > 0 ? { ids, source } : null;
}

const importFromRe = /^\s*import\s+[\s\S]+?\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm;

/**
 * Compares original script content with oxc output and re-adds value imports
 * that were stripped because they appeared unused within the script block.
 * These imports may be referenced in the Svelte template.
 * Handles partial stripping: if an import has both used and unused identifiers,
 * only the stripped ones are re-added.
 * @param {string} original - original script block content
 * @param {string} transformed - oxc-transformed output
 * @returns {string}
 */
function restoreStrippedImports(original, transformed) {
	const originalImports = original.match(importFromRe);
	if (!originalImports) return transformed;

	/** @type {string[]} */
	const restoreStatements = [];

	for (const imp of originalImports) {
		const parsed = getImportedIdentifiers(imp);
		if (!parsed) continue;

		const missingIds = parsed.ids.filter(
			(id) => !new RegExp(`\\b${id.local}\\b`).test(transformed)
		);
		if (missingIds.length === 0) continue;

		// If ALL identifiers are missing, restore the original import as-is (single-lined)
		if (missingIds.length === parsed.ids.length) {
			restoreStatements.push(imp.replace(/\s*\n\s*/g, ' ').trim());
			continue;
		}

		// Partial strip: rebuild import for only the missing identifiers
		const defaultIds = missingIds.filter((id) => id.kind === 'default');
		const namedIds = missingIds.filter((id) => id.kind === 'named');
		const nsIds = missingIds.filter((id) => id.kind === 'namespace');

		/** @type {string[]} */
		const parts = [];
		if (defaultIds.length > 0) parts.push(defaultIds[0].local);
		if (namedIds.length > 0) {
			const specifiers = namedIds.map((id) =>
				id.imported ? `${id.imported} as ${id.local}` : id.local
			);
			parts.push(`{ ${specifiers.join(', ')} }`);
		}
		if (nsIds.length > 0) parts.push(`* as ${nsIds[0].local}`);

		if (parts.length > 0) {
			restoreStatements.push(`import ${parts.join(', ')} from '${parsed.source}';`);
		}
	}

	if (restoreStatements.length > 0) {
		return restoreStatements.join('\n') + '\n' + transformed;
	}
	return transformed;
}

/**
 * @param {ResolvedConfig | InlineConfig} config
 * @returns {{ style: SveltePreprocessor }}
 */
function viteStyle(config = {}) {
	/** @type {Promise<CssTransform> | CssTransform} */
	let cssTransform;
	const style = /** @type {SveltePreprocessor} */ (
		async ({ attributes, content, filename = '' }) => {
			const ext = attributes.lang ? `.${attributes.lang}` : '.css';
			if (attributes.lang && !isCSSRequest(ext)) return;
			if (!cssTransform) {
				cssTransform = createCssTransform(style, config).then((t) => (cssTransform = t));
			}
			const transform = await cssTransform;
			const suffix = `${lang_sep}${ext}`;
			const moduleId = `${filename}${suffix}`;
			const { code, map, deps } = await transform(content, moduleId);
			removeLangSuffix(map, suffix);
			mapToRelative(map, filename);
			const dependencies = deps ? Array.from(deps).filter((d) => !d.endsWith(suffix)) : undefined;
			return {
				code,
				map: map ?? undefined,
				dependencies
			};
		}
	);
	// @ts-expect-error tag so can be found by v-p-s
	style.__resolvedConfig = null;
	return { style };
}

/**
 * @param {SveltePreprocessor} style
 * @param {ResolvedConfig | InlineConfig} config
 * @returns {Promise<CssTransform>}
 */
async function createCssTransform(style, config) {
	/** @type {ResolvedConfig} */
	let resolvedConfig;
	// @ts-expect-error special prop added if running in v-p-s
	if (style.__resolvedConfig) {
		// @ts-expect-error not typed
		resolvedConfig = style.__resolvedConfig;
	} else if (isResolvedConfig(config)) {
		resolvedConfig = config;
	} else {
		// default to "build" if no NODE_ENV is set to avoid running in dev mode for svelte-check etc.
		const useBuild = !process.env.NODE_ENV || process.env.NODE_ENV === 'production';
		const command = useBuild ? 'build' : 'serve';
		const defaultMode = useBuild ? 'production' : 'development';
		resolvedConfig = await resolveConfig(config, command, defaultMode, defaultMode, false);
	}
	return async (code, filename) => {
		return preprocessCSS(code, filename, resolvedConfig);
	};
}

/**
 * @param {any} config
 * @returns {config is ResolvedConfig}
 */
function isResolvedConfig(config) {
	return !!config.inlineConfig;
}
