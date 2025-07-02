import { log } from './log.js';

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @param {import('vite').ResolvedConfig} config
 * @returns {{
 * 	prependPreprocessors: import('svelte/compiler').PreprocessorGroup[],
 * 	appendPreprocessors: import('svelte/compiler').PreprocessorGroup[]
 * }}
 */
function buildExtraPreprocessors(options, config) {
	/** @type {import('svelte/compiler').PreprocessorGroup[]} */
	const prependPreprocessors = [];
	/** @type {import('svelte/compiler').PreprocessorGroup[]} */
	const appendPreprocessors = [];

	const pluginsWithPreprocessorsDeprecated = config.plugins.filter((p) => p.api?.sveltePreprocess);
	if (pluginsWithPreprocessorsDeprecated.length > 0) {
		log.warn(
			`The following plugins use the deprecated 'plugin.api.sveltePreprocess' field. Please contact their maintainers and ask them to use a vite plugin transform instead: ${pluginsWithPreprocessorsDeprecated
				.map((p) => p.name)
				.join(', ')}`
		);
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
				.join(', ')}`,
			undefined,
			'preprocess'
		);
	}
	if (included.length > 0) {
		log.debug(
			`Adding svelte preprocessors defined by these vite plugins: ${included
				.map((p) => p.name)
				.join(', ')}`,
			undefined,
			'preprocess'
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
