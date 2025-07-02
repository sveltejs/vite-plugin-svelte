import type { ResolvedOptions } from './options.d.ts';
import type { IdFilter, IdParser } from './id.d.ts';
import type { CompileSvelte } from './compile.d.ts';
import type { Environment } from 'vite';
// eslint-disable-next-line n/no-missing-import
import { VitePluginSvelteCache } from '../utils/vite-plugin-svelte-cache.js';

interface EnvContext {
	environment: Environment;
}

export interface PluginAPI {
	options: ResolvedOptions;
	getEnvironmentCache: (arg: EnvContext) => VitePluginSvelteCache;
	idFilter: IdFilter;
	idParser: IdParser;
	compileSvelte: CompileSvelte;
}
