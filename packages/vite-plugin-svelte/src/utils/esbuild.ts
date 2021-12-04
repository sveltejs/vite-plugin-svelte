import { promises as fs } from 'fs';
import { compile, preprocess } from 'svelte/compiler';
import { DepOptimizationOptions } from 'vite';
import { Compiled } from './compile';
import { log } from './log';
import { CompileOptions, ResolvedOptions } from './options';
import { toESBuildError } from './error';

type EsbuildOptions = NonNullable<DepOptimizationOptions['esbuildOptions']>;
type EsbuildPlugin = NonNullable<EsbuildOptions['plugins']>[number];
type EsbuildPluginBuild = Parameters<EsbuildPlugin['setup']>[0];

export function esbuildSveltePlugin(options: ResolvedOptions): EsbuildPlugin {
	return {
		name: 'vite-plugin-svelte:optimize-svelte',
		setup(build) {
			disableVitePrebundleSvelte(build);

			const svelteExtensions = (options.extensions ?? ['.svelte']).map((ext) => ext.slice(1));
			const svelteFilter = new RegExp(`\\.(` + svelteExtensions.join('|') + `)(\\?.*)?$`);

			build.onLoad({ filter: svelteFilter }, async ({ path: filename }) => {
				const code = await fs.readFile(filename, 'utf8');
				try {
					const contents = await compileSvelte(options, { filename, code });
					return { contents };
				} catch (e) {
					return { errors: [toESBuildError(e)] };
				}
			});
		}
	};
}

function disableVitePrebundleSvelte(build: EsbuildPluginBuild) {
	const viteDepPrebundlePlugin = build.initialOptions.plugins?.find(
		(v) => v.name === 'vite:dep-pre-bundle'
	);

	if (!viteDepPrebundlePlugin) return;

	// Prevent vite:dep-pre-bundle from externalizing svelte files
	const _setup = viteDepPrebundlePlugin.setup.bind(viteDepPrebundlePlugin);
	viteDepPrebundlePlugin.setup = function (build) {
		const _onResolve = build.onResolve.bind(build);
		build.onResolve = function (options, callback) {
			if (options.filter.source.includes('svelte')) {
				options.filter = new RegExp(
					options.filter.source.replace('|svelte', ''),
					options.filter.flags
				);
			}
			return _onResolve(options, callback);
		};
		return _setup(build);
	};
}

async function compileSvelte(
	options: ResolvedOptions,
	{ filename, code }: { filename: string; code: string }
): Promise<string> {
	const compileOptions: CompileOptions = {
		...options.compilerOptions,
		css: true,
		filename,
		generate: 'dom'
	};

	let preprocessed;

	if (options.preprocess) {
		preprocessed = await preprocess(code, options.preprocess, { filename });
		if (preprocessed.map) compileOptions.sourcemap = preprocessed.map;
	}

	const finalCode = preprocessed ? preprocessed.code : code;

	const dynamicCompileOptions = await options.experimental?.dynamicCompileOptions?.({
		filename,
		code: finalCode,
		compileOptions
	});

	if (dynamicCompileOptions && log.debug.enabled) {
		log.debug(`dynamic compile options for  ${filename}: ${JSON.stringify(dynamicCompileOptions)}`);
	}

	const finalCompileOptions = dynamicCompileOptions
		? {
				...compileOptions,
				...dynamicCompileOptions
		  }
		: compileOptions;

	const compiled = compile(finalCode, finalCompileOptions) as Compiled;

	return compiled.js.code + '//# sourceMappingURL=' + compiled.js.map.toUrl();
}
