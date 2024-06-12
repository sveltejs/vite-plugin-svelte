import type { Processed, CompileResult } from 'svelte/compiler';
import type { SvelteRequest } from './id.d.ts';
import type { ResolvedOptions } from './options.d.ts';

export type CompileSvelte = (
	svelteRequest: SvelteRequest,
	code: string,
	options: Partial<ResolvedOptions>
) => Promise<CompileData>;

export interface Code {
	code: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	map?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	dependencies?: any[];
}

export interface CompileData {
	filename: string;
	normalizedFilename: string;
	lang: string;
	compiled: CompileResult;
	ssr: boolean | undefined;
	dependencies: string[];
	preprocessed: Processed;
}
