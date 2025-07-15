import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { log } from './log.js';

export const knownSvelteConfigNames = ['js', 'ts', 'mjs', 'mts'].map(
	(ext) => `svelte.config.${ext}`
);

/**
 * @param {string} filePath
 * @param {number} timestamp
 */
async function dynamicImportDefault(filePath, timestamp) {
	return await import(filePath + '?t=' + timestamp).then((m) => m.default);
}

/**
 * @param {import('vite').UserConfig} [viteConfig]
 * @param {Partial<import('../public.d.ts').Options>} [inlineOptions]
 * @returns {Promise<Partial<import('../public.d.ts').SvelteConfig> | undefined>}
 */
export async function loadSvelteConfig(viteConfig, inlineOptions) {
	if (inlineOptions?.configFile === false) {
		return;
	}
	const configFile = findConfigToLoad(viteConfig, inlineOptions);
	if (configFile) {
		try {
			const result = await dynamicImportDefault(
				pathToFileURL(configFile).href,
				fs.statSync(configFile).mtimeMs
			);
			if (result != null) {
				return {
					...result,
					configFile
				};
			} else {
				throw new Error(`invalid export in ${configFile}`);
			}
		} catch (e) {
			log.error(`failed to import config ${configFile}`, e);
			throw e;
		}
	}
}

/**
 * @param {import('vite').UserConfig | undefined} viteConfig
 * @param {Partial<import('../public.d.ts').Options> | undefined} inlineOptions
 * @returns {string | undefined}
 */
function findConfigToLoad(viteConfig, inlineOptions) {
	const root = viteConfig?.root || process.cwd();
	if (inlineOptions?.configFile) {
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
			log.info(`no Svelte config found at ${root} - using default configuration.`);
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
