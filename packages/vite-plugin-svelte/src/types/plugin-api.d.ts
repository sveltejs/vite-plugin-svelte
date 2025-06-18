import type { ResolvedOptions } from './options.d.ts';
import { VitePluginSvelteCache } from '../utils/vite-plugin-svelte-cache.js';
import { VitePluginSvelteStats } from '../utils/vite-plugin-svelte-stats.js';

export interface PluginAPI {
	/**
	 * must not be used by plugins outside of the vite-plugin-svelte monorepo
	 * this is not part of our public semver contract, breaking changes to it can and will happen in patch releases
	 * @internal
	 */
	__internal: {
		options: ResolvedOptions;
		cache?: VitePluginSvelteCache;
		stats?: VitePluginSvelteStats;
	};
}
