import type { ResolvedOptions } from './options.d.ts';
import type { IdFilter, IdParser } from './id.d.ts';
import type { CompileSvelte } from './compile.d.ts';
import type { Rollup } from 'vite';

export interface PluginAPI {
	options: ResolvedOptions;
	filter: IdFilter;
	idParser: IdParser;
	compileSvelte: CompileSvelte;
	/**
	 * Sourcemaps returned by our own preprocess hook, keyed by svelte request id.
	 * The compile hook forwards them to `svelte.compile` as the external-preprocessor
	 * map (needed for `css.map` chaining, e.g. scss sources).
	 */
	preprocessedMaps: Map<string, Rollup.SourceMap>;
}
