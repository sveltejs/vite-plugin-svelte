import type { Processed, CompileResult } from 'svelte/compiler';
import type { SvelteRequest } from './id.d.ts';
import type { ResolvedOptions } from './options.d.ts';
import type { CustomPluginOptionsVite, Rollup } from 'vite';

export type CompileSvelte = (
	svelteRequest: SvelteRequest,
	code: string,
	options: Partial<ResolvedOptions>,
	sourcemap?: Rollup.SourceMap
) => Promise<CompileData>;

export type PreprocessSvelte = (
	svelteRequest: SvelteRequest,
	code: string,
	options: Partial<ResolvedOptions>
) => Promise<Processed | undefined>;

export interface Code {
	code: string;
	map?: any;
	dependencies?: any[];
	hasGlobal?: boolean;
	moduleType?: string; //vite-8 beta
	meta?: {
		vite?: CustomPluginOptionsVite;
	};
}

export interface CompileData {
	filename: string;
	normalizedFilename: string;
	cssId: string;
	lang: string;
	compiled: CompileResult;
	ssr: boolean | undefined;
}
