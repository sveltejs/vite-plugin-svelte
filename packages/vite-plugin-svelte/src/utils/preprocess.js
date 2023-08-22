import MagicString from 'magic-string';
import { log } from './log.js';
import path from 'node:path';

/**
 * this appends a *{} rule to component styles to force the svelte compiler to add style classes to all nodes
 * That means adding/removing class rules from <style> node won't trigger js updates as the scope classes are not changed
 *
 * only used during dev with enabled css hmr
 *
 * @returns {import('svelte/types/compiler/preprocess').PreprocessorGroup}
 */
export function createInjectScopeEverythingRulePreprocessorGroup() {
	return {
		style({ content, filename }) {
			const s = new MagicString(content);
			s.append(' *{}');
			return {
				code: s.toString(),
				map: s.generateDecodedMap({
					source: filename ? path.basename(filename) : undefined,
					hires: true
				})
			};
		}
	};
}

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @param {import('vite').ResolvedConfig} config
 * @returns {{
 * 	prependPreprocessors: import('svelte/types/compiler/preprocess').PreprocessorGroup[],
 * 	appendPreprocessors: import('svelte/types/compiler/preprocess').PreprocessorGroup[]
 * }}
 */
function buildExtraPreprocessors(options, config) {
	/** @type {import('svelte/types/compiler/preprocess').PreprocessorGroup[]} */
	const prependPreprocessors = [];
	/** @type {import('svelte/types/compiler/preprocess').PreprocessorGroup[]} */
	const appendPreprocessors = [];

	// @ts-ignore
	const pluginsWithPreprocessorsDeprecated = config.plugins.filter((p) => p?.sveltePreprocess);
	if (pluginsWithPreprocessorsDeprecated.length > 0) {
		log.warn(
			`The following plugins use the deprecated 'plugin.sveltePreprocess' field. Please contact their maintainers and ask them to move it to 'plugin.api.sveltePreprocess': ${pluginsWithPreprocessorsDeprecated
				.map((p) => p.name)
				.join(', ')}`
		);
		// patch plugin to avoid breaking
		pluginsWithPreprocessorsDeprecated.forEach((p) => {
			if (!p.api) {
				p.api = {};
			}
			if (p.api.sveltePreprocess === undefined) {
				// @ts-ignore
				p.api.sveltePreprocess = p.sveltePreprocess;
			} else {
				log.error(
					`ignoring plugin.sveltePreprocess of ${p.name} because it already defined plugin.api.sveltePreprocess.`
				);
			}
		});
	}
	/** @type {import('vite').Plugin[]} */
	const pluginsWithPreprocessors = config.plugins.filter((p) => p?.api?.sveltePreprocess);
	/** @type {import('vite').Plugin[]} */
	const ignored = [];
	/** @type {import('vite').Plugin[]} */
	const included = [];
	for (const p of pluginsWithPreprocessors) {
		if (
			options.ignorePluginPreprocessors === true ||
			(Array.isArray(options.ignorePluginPreprocessors) &&
				options.ignorePluginPreprocessors?.includes(p.name))
		) {
			ignored.push(p);
		} else {
			included.push(p);
		}
	}
	if (ignored.length > 0) {
		log.debug(
			`Ignoring svelte preprocessors defined by these vite plugins: ${ignored
				.map((p) => p.name)
				.join(', ')}`
		);
	}
	if (included.length > 0) {
		log.debug(
			`Adding svelte preprocessors defined by these vite plugins: ${included
				.map((p) => p.name)
				.join(', ')}`
		);
		appendPreprocessors.push(...pluginsWithPreprocessors.map((p) => p.api.sveltePreprocess));
	}

	return { prependPreprocessors, appendPreprocessors };
}

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @param {import('vite').ResolvedConfig} config
 */
export function addExtraPreprocessors(options, config) {
	const { prependPreprocessors, appendPreprocessors } = buildExtraPreprocessors(options, config);
	if (prependPreprocessors.length > 0 || appendPreprocessors.length > 0) {
		if (!options.preprocess) {
			options.preprocess = [...prependPreprocessors, ...appendPreprocessors];
		} else if (Array.isArray(options.preprocess)) {
			options.preprocess.unshift(...prependPreprocessors);
			options.preprocess.push(...appendPreprocessors);
		} else {
			options.preprocess = [...prependPreprocessors, options.preprocess, ...appendPreprocessors];
		}
	}
}
