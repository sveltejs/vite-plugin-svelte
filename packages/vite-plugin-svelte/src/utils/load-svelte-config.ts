import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { log } from './log';
import { Options } from './options';
import { ResolvedConfig } from 'vite';

const knownSvelteConfigNames = ['svelte.config.js', 'svelte.config.cjs', 'svelte.config.mjs'];

// hide dynamic import from ts transform to prevent it turning into a require
// see https://github.com/microsoft/TypeScript/issues/43329#issuecomment-811606238
const dynamicImportDefault = new Function('path', 'return import(path).then(m => m.default)');

export async function loadSvelteConfig(
	viteConfig: ResolvedConfig,
	inlineOptions: Partial<Options>
) {
	const configFile = findConfigToLoad(viteConfig, inlineOptions);

	if (configFile) {
		let err;
		// try to use dynamic import for svelte.config.js first
		if (configFile.endsWith('.js') || configFile.endsWith('.mjs')) {
			try {
				return await dynamicImportDefault(pathToFileURL(configFile).href);
			} catch (e) {
				log.error(`failed to import config ${configFile}`, e);
				err = e;
			}
		}
		// cjs or error with dynamic import
		try {
			return require(configFile);
		} catch (e) {
			log.error(`failed to require config ${configFile}`, e);
			if (!err) {
				err = e;
			}
		}
		// failed to load existing config file
		throw err;
	}
}

function findConfigToLoad(viteConfig: ResolvedConfig, inlineOptions: Partial<Options>) {
	const root = viteConfig.root || process.cwd();
	if (inlineOptions.configFile) {
		const abolutePath = path.isAbsolute(inlineOptions.configFile)
			? inlineOptions.configFile
			: path.resolve(root, inlineOptions.configFile);
		if (!fs.existsSync(abolutePath)) {
			throw new Error(`failed to find svelte config file ${abolutePath}.`);
		}
		return abolutePath;
	} else {
		const existingKnownConfigFiles = knownSvelteConfigNames
			.map((candidate) => path.resolve(root, candidate))
			.filter((file) => fs.existsSync(file));
		if (existingKnownConfigFiles.length === 0) {
			log.debug(`no svelte config found at ${root}`);
			return;
		} else if (existingKnownConfigFiles.length > 1) {
			log.warn(
				`found more than one svelte config file, using ${existingKnownConfigFiles[0]}. you should only have one!`,
				existingKnownConfigFiles
			);
		}
		return existingKnownConfigFiles[0];
	}
}
