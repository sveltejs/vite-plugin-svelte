import path from 'path';
import fs from 'fs';
import { log } from './log';

const knownSvelteConfigNames = ['svelte.config.js', 'svelte.config.cjs'];

// hide dynamic import from ts transform to prevent it turning into a require
// see https://github.com/microsoft/TypeScript/issues/43329#issuecomment-811606238
const dynamicImportDefault = new Function('path', 'return import(path).then(m => m.default)');

export async function loadSvelteConfig(root: string = process.cwd()) {
	const foundConfigs = knownSvelteConfigNames
		.map((candidate) => path.resolve(root, candidate))
		.filter((file) => fs.existsSync(file));
	if (foundConfigs.length === 0) {
		log.debug(`no svelte config found at ${root}`);
		return;
	} else if (foundConfigs.length > 1) {
		log.warn(
			`found more than one svelte config file, using ${foundConfigs[0]}. you should only have one!`,
			foundConfigs
		);
	}
	try {
		const config = await dynamicImportDefault(foundConfigs[0]);
		log.debug(`loaded svelte config ${foundConfigs[0]}`, config);
		return config;
	} catch (e) {
		log.error(`failed to load config ${foundConfigs[0]}`, e);
	}
}
