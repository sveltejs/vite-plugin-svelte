import process from 'node:process';
import path from 'node:path';
import { log } from '../utils/log.js';
import * as vite from 'vite';
import { knownSvelteConfigNames } from '../utils/load-svelte-config.js';
import { VitePluginSvelteCache } from '../utils/vite-plugin-svelte-cache.js';
import { VitePluginSvelteStats } from '../utils/vite-plugin-svelte-stats.js';
import {
	buildExtraViteConfig,
	validateInlineOptions,
	resolveOptions,
	preResolveOptions,
	ensureConfigEnvironmentMainFields,
	ensureConfigEnvironmentConditions
} from '../utils/options.js';
import {buildIdFilter, buildIdParser} from "../utils/id.js";
import {createCompileSvelte} from "../utils/compile.js";


// @ts-expect-error rolldownVersion
const { version: viteVersion, rolldownVersion, perEnvironmentState } = vite;

/**
 * @param {Partial<import('../public.d.ts').Options>} [inlineOptions]
 * @param {import('../types/plugin-api.d.ts').PluginAPI} api
 * @returns {import('vite').Plugin}
 */
export function configure(api,inlineOptions) {
	if (process.env.DEBUG != null) {
		log.setLevel('debug');
	}
	if (rolldownVersion) {
		log.warn.once(
			`!!! Support for rolldown-vite in vite-plugin-svelte is experimental (rolldown: ${rolldownVersion}, vite: ${viteVersion}) !!!`
		);
	}

	validateInlineOptions(inlineOptions);

	/**
     * @type {import("../types/options.d.ts").PreResolvedOptions}
     */
	let preOptions;

	/** @type {import('vite').Plugin} */
	return {
		name: 'vite-plugin-svelte:config',
		// make sure it runs first
		enforce: 'pre',
		config:{
			order: 'pre',
			async handler(config, configEnv) {
				// setup logger
				if (process.env.DEBUG) {
					log.setLevel('debug');
				} else if (config.logLevel) {
					log.setLevel(config.logLevel);
				}

				preOptions = await preResolveOptions(inlineOptions, config, configEnv);
				// extra vite config
				const extraViteConfig = await buildExtraViteConfig(preOptions, config);
				log.debug('additional vite config', extraViteConfig, 'config');
				return extraViteConfig;
			}
		},
		configResolved: {
			order: 'pre',
			handler(config) {
				const options = resolveOptions(preOptions, config);
				api.options = options;
				api.getEnvironmentState = perEnvironmentState(_env => {
					const cache = new VitePluginSvelteCache()
					const stats = new VitePluginSvelteStats(cache)
					return {cache,stats}
				})
				api.idFilter = buildIdFilter(options);

				api.idParser = buildIdParser(options);
				api.compileSvelte = createCompileSvelte();
				log.debug('resolved options', api.options, 'config');
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
			const { options } = api;
			options.server = server;
			restartOnSvelteConfigChanges(options)
		}
	};
}

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @returns {void}
 */
export function restartOnSvelteConfigChanges(options) {
	const { server, configFile: svelteConfigFile } = options;
	if (!server) {
		return;
	}
	const { watcher, ws } = server;
	const { root, server: serverConfig } = server.config;


	/** @type {(filename: string) => void} */
	const triggerViteRestart = (filename) => {
		if (serverConfig.middlewareMode) {
			// in middlewareMode we can't restart the server automatically
			// show the user an overlay instead
			const message =
				'Svelte config change detected, restart your dev process to apply the changes.';
			log.info(message, filename);
			ws.send({
				type: 'error',
				err: { message, stack: '', plugin: 'vite-plugin-svelte', id: filename }
			});
		} else {
			log.info(`svelte config changed: restarting vite server. - file: ${filename}`);
			server.restart();
		}
	};

	// collection of watcher listeners by event
	/** @type {Record<string, Function[]>} */
	const listenerCollection = {
		add: [],
		change: [],
		unlink: []
	};

	if (svelteConfigFile !== false) {
		// configFile false means we ignore the file and external process is responsible
		const possibleSvelteConfigs = knownSvelteConfigNames.map((cfg) => path.join(root, cfg));
		/** @type {(filename: string) => void} */
		const restartOnConfigAdd = (filename) => {
			if (possibleSvelteConfigs.includes(filename)) {
				triggerViteRestart(filename);
			}
		};

		/** @type {(filename: string) => void} */
		const restartOnConfigChange = (filename) => {
			if (filename === svelteConfigFile) {
				triggerViteRestart(filename);
			}
		};

		if (svelteConfigFile) {
			listenerCollection.change.push(restartOnConfigChange);
			listenerCollection.unlink.push(restartOnConfigChange);
		} else {
			listenerCollection.add.push(restartOnConfigAdd);
		}
	}

	Object.entries(listenerCollection).forEach(([evt, listeners]) => {
		if (listeners.length > 0) {
			watcher.on(evt, (filename) => listeners.forEach((listener) => listener(filename)));
		}
	});
}
