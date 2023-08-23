import path from 'node:path';
import { builtinModules } from 'node:module';
import { resolveDependencyData, isCommonDepWithoutSvelteField } from './dependencies.js';
import { normalizePath } from 'vite';

/**
 * @param {string} importee
 * @param {string | undefined} importer
 * @param {import('./vite-plugin-svelte-cache').VitePluginSvelteCache} cache
 * @returns {Promise<string | void>}
 */
export async function resolveViaPackageJsonSvelte(importee, importer, cache) {
	if (
		importer &&
		isBareImport(importee) &&
		!isNodeInternal(importee) &&
		!isCommonDepWithoutSvelteField(importee)
	) {
		const cached = cache.getResolvedSvelteField(importee, importer);
		if (cached) {
			return cached;
		}
		const pkgData = await resolveDependencyData(importee, importer);
		if (pkgData) {
			const { pkg, dir } = pkgData;
			if (pkg.svelte) {
				const result = normalizePath(path.resolve(dir, pkg.svelte));
				cache.setResolvedSvelteField(importee, importer, result);
				return result;
			}
		}
	}
}

/**
 * @param {string} importee
 * @returns {boolean}
 */
function isNodeInternal(importee) {
	return importee.startsWith('node:') || builtinModules.includes(importee);
}

/**
 * @param {string} importee
 * @returns {boolean}
 */
function isBareImport(importee) {
	if (
		!importee ||
		importee[0] === '.' ||
		importee[0] === '\0' ||
		importee.includes(':') ||
		path.isAbsolute(importee)
	) {
		return false;
	}
	const parts = importee.split('/');
	switch (parts.length) {
		case 1:
			return true;
		case 2:
			return parts[0].startsWith('@');
		default:
			return false;
	}
}
