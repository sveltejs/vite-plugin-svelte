import type { ResolvedOptions } from './options.d.ts';
import type { IdFilter, IdParser } from './id.d.ts';
import type { CompileSvelte } from './compile.d.ts';

export interface PluginAPI {
	options: ResolvedOptions;
	filter: IdFilter;
	idParser: IdParser;
	compileSvelte: CompileSvelte;
	/**
	 * @deprecated  use 'filter' instead
	 * // TODO remove in next major
	 */
	idFilter: IdFilter;
}
