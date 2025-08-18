import fs from 'node:fs';
import { log } from '../utils/log.js';

/**
 * if svelte config includes files that vite treats as assets (e.g. .svg)
 * we have to manually load them to avoid getting urls
 *
 * @param {import('../types/plugin-api.d.ts').PluginAPI} api
 * @returns {import('vite').Plugin}
 */
export function loadCustom(api) {
	/** @type {import('vite').Plugin} */
	const plugin = {
		name: 'vite-plugin-svelte:load-custom',
		enforce: 'pre', // must come before vites own asset handling or custom extensions like .svg won't work
		configResolved() {
			//@ts-expect-error load defined below but filter not in type
			plugin.load.filter = api.filter;
		},

		load: {
			//filter: is set in configResolved
			async handler(id) {
				const config = this.environment.config;
				const ssr = config.consumer === 'server';
				const svelteRequest = api.idParser(id, ssr);
				if (svelteRequest) {
					const { filename, query } = svelteRequest;
					if (!query.url && config.assetsInclude(filename)) {
						log.debug(
							`loading ${filename} to prevent vite asset handling to turn it into a url by default`,
							undefined,
							'load'
						);
						return fs.readFileSync(filename, 'utf-8');
					}
				}
			}
		}
	};
	return plugin;
}
