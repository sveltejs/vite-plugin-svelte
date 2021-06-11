import { ViteDevServer } from 'vite';
import { VitePluginSvelteCache } from './vite-plugin-svelte-cache';
import fs from 'fs';
import { log } from './log';
import { IdParser } from './id';

export function setupWatchers(
	server: ViteDevServer,
	cache: VitePluginSvelteCache,
	requestParser: IdParser
) {
	const watcher = server.watcher;

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

	watcher.on('change', emitChangeEventOnDependants);
	watcher.on('unlink', (filename) => {
		removeUnlinkedFromCache(filename);
		emitChangeEventOnDependants(filename);
	});
}
