import type { Processed, CompileResult } from 'svelte/compiler';
import type { SvelteRequest } from './id.d.ts';
import type { ResolvedOptions } from './options.d.ts';
import type { CustomPluginOptionsVite } from 'vite';

export type CompileSvelte = (
	svelteRequest: SvelteRequest,
	code: string,
	options: Partial<ResolvedOptions>
) => Promise<CompileData>;

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
