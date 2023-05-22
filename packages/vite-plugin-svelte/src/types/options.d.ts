// eslint-disable-next-line node/no-missing-import
import type { CompileOptions } from 'svelte/types/compiler/interfaces';
import type { ViteDevServer } from 'vite';
import { VitePluginSvelteStats } from '../utils/vite-plugin-svelte-stats.js';
// eslint-disable-next-line node/no-missing-import
import type { Options as InspectorOptions } from '@sveltejs/vite-plugin-svelte-inspector';
import type {Options} from '../index.d';


export interface PreResolvedOptions extends Options {
	// these options are non-nullable after resolve
	compilerOptions: CompileOptions;
	// extra options
	root: string;
	isBuild: boolean;
	isServe: boolean;
	isDebug: boolean;
}

export interface ResolvedOptions extends PreResolvedOptions {
	isProduction: boolean;
	server?: ViteDevServer;
	stats?: VitePluginSvelteStats;
}


