import type { Processed } from 'svelte/types/compiler/preprocess';
import type { SvelteRequest } from './id.d.ts';
import type { ResolvedOptions } from './options.d.ts';

export type CompileSvelte = (
	svelteRequest: SvelteRequest,
	code: string,
	options: Partial<ResolvedOptions>
) => Promise<CompileData>;

export interface Code {
	code: string;
	map?: any;
	dependencies?: any[];
}

export interface Compiled {
	js: Code;
	css: Code;
	ast: any; // TODO type
	warnings: any[]; // TODO type
	vars: {
		name: string;
		export_name: string;
		injected: boolean;
		module: boolean;
		mutated: boolean;
		reassigned: boolean;
		referenced: boolean;
		writable: boolean;
		referenced_from_script: boolean;
	}[];
	stats: {
		timings: {
			total: number;
		};
	};
}

export interface CompileData {
	filename: string;
	normalizedFilename: string;
	lang: string;
	compiled: Compiled;
	ssr: boolean | undefined;
	dependencies: string[];
	preprocessed: Processed;
}
