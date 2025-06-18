import type { ResolvedOptions } from './options.d.ts';
import { perEnvironmentState } from 'vite';
import { VitePluginSvelteCache } from '../utils/vite-plugin-svelte-cache.js';
import { VitePluginSvelteStats } from '../utils/vite-plugin-svelte-stats.js';
import type { IdFilter, IdParser } from './id.d.ts';
import {CompileSvelte} from './compile.d.ts';

interface EnvironmentState {
	cache: VitePluginSvelteCache;
	stats: VitePluginSvelteStats;
}
export interface PluginAPI {
	options: ResolvedOptions;
	getEnvironmentState: ReturnType<typeof perEnvironmentState<EnvironmentState>>;
	idFilter: IdFilter;
	idParser: IdParser;
	compileSvelte: CompileSvelte;
}
