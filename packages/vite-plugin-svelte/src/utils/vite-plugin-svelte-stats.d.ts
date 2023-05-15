import { VitePluginSvelteStats as clazz } from './vite-plugin-svelte-stats';

export interface Stat {
	file: string;
	pkg?: string;
	start: number;
	end: number;
}

export interface StatCollection {
	name: string;
	options: CollectionOptions;
	//eslint-disable-next-line no-unused-vars
	start: (file: string) => () => void;
	stats: Stat[];
	packageStats?: PackageStats[];
	collectionStart: number;
	duration?: number;
	finish: () => Promise<void> | void;
	finished: boolean;
}

export interface PackageStats {
	pkg: string;
	files: number;
	duration: number;
}

export interface CollectionOptions {
	//eslint-disable-next-line no-unused-vars
	logInProgress: (collection: StatCollection, now: number) => boolean;
	//eslint-disable-next-line no-unused-vars
	logResult: (collection: StatCollection) => boolean;
}

export type VitePluginSvelteStats = typeof clazz;
