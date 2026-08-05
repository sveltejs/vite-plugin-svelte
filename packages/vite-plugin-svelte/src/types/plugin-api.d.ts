import type { ResolvedOptions } from './options.d.ts';
import type { IdFilter, IdParser } from './id.d.ts';
import type { CompileSvelte } from './compile.d.ts';
import type { ResolvedConfig } from 'vite';

export interface PluginAPI {
	options: ResolvedOptions;
	filter: IdFilter;
	idParser: IdParser;
	compileSvelte: CompileSvelte;
	onConfigResolved: (callback: (config: ResolvedConfig) => void) => void;
	runConfigResolved: (config: ResolvedConfig) => void;
}
