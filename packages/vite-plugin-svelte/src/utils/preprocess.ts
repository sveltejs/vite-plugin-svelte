import { ResolvedConfig, TransformResult } from 'vite';
import { Preprocessor, PreprocessorGroup, ResolvedOptions } from './options';
import { TransformPluginContext } from 'rollup';
import { log } from './log';
const supportedStyleLangs = ['css', 'less', 'sass', 'scss', 'styl', 'stylus', 'postcss'];

const supportedScriptLangs = ['ts'];

function createPreprocessorFromVitePlugin(
	config: ResolvedConfig,
	options: ResolvedOptions,
	pluginName: string,
	supportedLangs: string[]
): Preprocessor {
	const plugin = config.plugins.find((p) => p.name === pluginName);
	if (!plugin) {
		throw new Error(`failed to find plugin ${pluginName}`);
	}
	if (!plugin.transform) {
		throw new Error(`plugin ${pluginName} has no transform`);
	}
	const pluginTransform = plugin.transform!.bind((null as unknown) as TransformPluginContext);
	// @ts-ignore
	return async ({ attributes, content, filename }) => {
		const lang = attributes.lang as string;
		if (!supportedLangs.includes(lang)) {
			return { code: content };
		}
		const moduleId = `${filename}.${lang}`;
		const moduleGraph = options.server?.moduleGraph;
		if (moduleGraph && !moduleGraph.getModuleById(moduleId)) {
			await moduleGraph.ensureEntryFromUrl(moduleId);
		}
		const transformResult: TransformResult = (await pluginTransform(
			content,
			moduleId
		)) as TransformResult;
		// TODO vite:css transform currently returns an empty mapping that would kill svelte compiler.
		const hasMap = !!transformResult.map?.mappings;
		if (transformResult.map?.sources?.[0] === moduleId) {
			transformResult.map.sources[0] = filename as string;
		}
		return {
			code: transformResult.code,
			map: hasMap ? (transformResult.map as object) : null,
			dependencies: transformResult.deps
		};
	};
}

export function createVitePreprocessorGroup(
	config: ResolvedConfig,
	options: ResolvedOptions
): PreprocessorGroup {
	return {
		script: createPreprocessorFromVitePlugin(config, options, 'vite:esbuild', supportedScriptLangs),
		style: createPreprocessorFromVitePlugin(config, options, 'vite:css', supportedStyleLangs)
	} as PreprocessorGroup;
}

export function buildExtraPreprocessors(options: ResolvedOptions, config: ResolvedConfig) {
	const extraPreprocessors = [];
	if (options.useVitePreprocess) {
		log.debug('adding vite preprocessor');
		extraPreprocessors.push(createVitePreprocessorGroup(config, options));
	}

	const pluginsWithPreprocessors = config.plugins.filter((p) => p?.sveltePreprocess);
	if (pluginsWithPreprocessors.length > 0) {
		log.debug(
			`adding preprocessors from other vite plugins: ${pluginsWithPreprocessors
				.map((p) => p.name)
				.join(', ')}`
		);
		extraPreprocessors.push(
			...pluginsWithPreprocessors.map((p) => p.sveltePreprocess as PreprocessorGroup)
		);
	}

	return extraPreprocessors;
}
