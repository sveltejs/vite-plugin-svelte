import type { CompileOptions } from 'svelte/compiler';
import type { ViteDevServer } from 'vite';
// eslint-disable-next-line n/no-missing-import
import { VitePluginSvelteStats } from '../utils/vite-plugin-svelte-stats.js';
import type { Options } from '../public.d.ts';

export type RestrictedSvelteCompileOptions = Omit<
	CompileOptions,
	'filename' | 'format' | 'generate'
>;
export type DynamicRestrictedSvelteCompileOptions =
	| RestrictedSvelteCompileOptions
	| ((args: { filename: string; code: string }) => RestrictedSvelteCompileOptions);

export interface PreResolvedOptions extends Options {
	// these options are non-nullable after resolve
	compilerOptions: DynamicRestrictedSvelteCompileOptions;
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
