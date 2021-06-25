import { VitePluginSvelteCache } from './vite-plugin-svelte-cache';
import fs from 'fs';
import { log } from './log';
import { IdParser } from './id';
import { ResolvedOptions } from './options';
import { knownSvelteConfigNames } from './load-svelte-config';
import path from 'path';

export function setupWatchers(
	options: ResolvedOptions,
	cache: VitePluginSvelteCache,
	requestParser: IdParser
) {
	const { server, configFile: svelteConfigFile } = options;
	if (!server) {
		return;
	}
	const watcher = server.watcher;
	const viteConfig = server.config.configFile;
	const root = server.config.root;

	const emitChangeEventOnDependants = (filename: string) => {
		const dependants = cache.getDependants(filename);
		dependants.forEach((dependant) => {
			if (fs.existsSync(dependant)) {
				log.debug(
					`emitting virtual change event for "${dependant}" because depdendency "${filename}" changed`
				);
				watcher.emit('change', dependant);
			}
		});
	};

	const removeUnlinkedFromCache = (filename: string) => {
		const svelteRequest = requestParser(filename, false);
		if (svelteRequest) {
			const removedFromCache = cache.remove(svelteRequest);
			if (removedFromCache) {
				log.debug(`cleared VitePluginSvelteCache for deleted file ${filename}`);
			}
		}
	};

	const possibleSvelteConfigs = knownSvelteConfigNames.map((cfg) => path.join(root, cfg));
	const restartOnConfigAdd = (filename: string) => {
		if (possibleSvelteConfigs.includes(filename)) {
			log.info(`svelte config added: restarting vite server. - file: ${filename}`);
			server.watcher.emit('change', viteConfig);
		}
	};

	const restartOnConfigChange = (filename: string) => {
		if (filename === svelteConfigFile) {
			log.info(`svelte config changed: restarting vite server. - file: ${filename}`);
			server.watcher.emit('change', viteConfig);
		}
	};

	// collection of watcher listeners by event
	const listeners = {
		add: [],
		change: [emitChangeEventOnDependants],
		unlink: [removeUnlinkedFromCache, emitChangeEventOnDependants]
	};
	if (svelteConfigFile) {
		listeners.change.push(restartOnConfigChange);
		listeners.unlink.push(restartOnConfigChange);
	} else {
		// @ts-ignore
		listeners.add.push(restartOnConfigAdd);
	}

	Object.entries(listeners).forEach(([evt, listeners]) => {
		if (listeners.length > 0) {
			watcher.on(evt, (filename) => listeners.forEach((listener) => listener(filename)));
		}
	});
}
