import type { Processed, CompileResult } from 'svelte/compiler';
import type { SvelteRequest } from './id.d.ts';
import type { ResolvedOptions } from './options.d.ts';
import type { CustomPluginOptionsVite, Rollup } from 'vite';

export type CompileSvelte = (
	svelteRequest: SvelteRequest,
	code: string,
	options: Partial<ResolvedOptions>,
	preprocessed?: Processed
) => Promise<CompileData>;

export type PreprocessSvelte = (
	svelteRequest: SvelteRequest,
	code: string,
	options: Partial<ResolvedOptions>
) => Promise<PreprocessTransformOutput | undefined>;

export interface PreprocessTransformOutput {
	code: string;
	map: Rollup.SourceMapInput;
	meta: {
		svelte: {
			preprocessed: Processed;
		};
	};
}

export interface Code {
	code: string;
	map?: any;
	dependencies?: any[];
	hasGlobal?: boolean;
	moduleType?: string; //rolldown-vite
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
	dependencies: string[];
	preprocessed: Processed;
}
