import process from 'node:process';
import { log } from '../utils/log.js';

import {
	buildExtraViteConfig,
	validateInlineOptions,
	resolveOptions,
	preResolveOptions,
	ensureConfigEnvironmentMainFields,
	ensureConfigEnvironmentConditions
} from '../utils/options.js';
import { setupWatchers } from '../utils/watch.js';

import * as vite from 'vite';
// @ts-expect-error rolldownVersion
const { version: viteVersion, rolldownVersion } = vite;

/** @typedef {import('../types/plugin-api.d.ts').PluginAPI} PluginAPI */

/**
 * @param {Partial<import('../public.d.ts').Options>} [inlineOptions]
 * @returns {import('vite').Plugin<PluginAPI>}
 */
export function config(inlineOptions) {
	if (process.env.DEBUG != null) {
		log.setLevel('debug');
	}
	if (rolldownVersion) {
		log.warn.once(
			`!!! Support for rolldown-vite in vite-plugin-svelte is experimental (rolldown: ${rolldownVersion}, vite: ${viteVersion}) !!!`
		);
	}

	validateInlineOptions(inlineOptions);

	/** @type {PluginAPI} */
	const api = {
		__internal: {
			// @ts-expect-error set in config hook
			options: {}
		}
	};

	/** @type {import('vite').Plugin<PluginAPI>} */
	return {
		name: 'vite-plugin-svelte:config',
		// make sure it runs first
		enforce: 'pre',
		api,
		async config(config, configEnv) {
			// setup logger
			if (process.env.DEBUG) {
				log.setLevel('debug');
			} else if (config.logLevel) {
				log.setLevel(config.logLevel);
			}

			const options = await preResolveOptions(inlineOptions, config, configEnv);
			// @ts-expect-error temporarily lend the options variable until fixed in configResolved
			api.__internal.options = options;
			// extra vite config
			const extraViteConfig = await buildExtraViteConfig(options, config);
			log.debug('additional vite config', extraViteConfig, 'config');
			return extraViteConfig;
		},

		configResolved: {
			order: 'pre', // we assign internal api here, make sure it really is first before our other plugins
			handler(config) {
				const options = resolveOptions(api.__internal.options, config);
				api.__internal.options = options;
				log.debug('resolved options', options, 'config');
			}
		},

		configEnvironment(name, config, opts) {
			ensureConfigEnvironmentMainFields(name, config, opts);
			// @ts-expect-error the function above should make `resolve.mainFields` non-nullable
			config.resolve.mainFields.unshift('svelte');

			ensureConfigEnvironmentConditions(name, config, opts);
			// @ts-expect-error the function above should make `resolve.conditions` non-nullable
			config.resolve.conditions.push('svelte');
		},

		configureServer(server) {
			const { options, cache } = api.__internal;
			options.server = server;
			setupWatchers(options, cache, requestParser);
		}
	};
}
