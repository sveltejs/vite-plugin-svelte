import type { Warning } from './options.d';

export interface LogFn {
	(message: string, payload?: any, namespace?: string): void;

	enabled: boolean;
	once: (message: string, payload?: any, namespace?: string) => void;
}

export type SvelteWarningsMessage = {
	id: string;
	filename: string;
	normalizedFilename: string;
	timestamp: number;
	warnings: Warning[]; // allWarnings filtered by warnings where onwarn did not call the default handler
	allWarnings: Warning[]; // includes warnings filtered by onwarn and our extra vite plugin svelte warnings
	rawWarnings: Warning[]; // raw compiler output
};
