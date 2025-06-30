export type SvelteQueryTypes = 'style';

export interface RequestQuery {
	// our own
	svelte?: boolean;
	type?: SvelteQueryTypes;
	// vite specific
	url?: boolean;
	raw?: boolean;
	direct?: boolean;
	inline?: boolean;
}

export interface SvelteRequest {
	id: string;
	cssId: string;
	filename: string;
	normalizedFilename: string;
	query: RequestQuery;
	timestamp: number;
	ssr: boolean;
	raw: boolean;
}

export interface SvelteModuleRequest {
	id: string;
	filename: string;
	normalizedFilename: string;
	query: RequestQuery;
	timestamp: number;
	ssr: boolean;
}

export type IdParser = (id: string, ssr: boolean, timestamp?: number) => SvelteRequest | undefined;

export type IdFilter = {
	id: {
		include: Array<string | RegExp>;
		exclude: Array<string | RegExp>;
	};
};
export type ModuleIdParser = (
	id: string,
	ssr: boolean,
	timestamp?: number
) => SvelteModuleRequest | undefined;
