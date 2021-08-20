import { log } from './log';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

export function findRootSvelteDependencies(root: string, cwdFallback = true): SvelteDependency[] {
	log.debug(`findSvelteDependencies: searching svelte dependencies in ${root}`);
	const pkgFile = path.join(root, 'package.json');
	if (!fs.existsSync(pkgFile)) {
		if (cwdFallback) {
			const cwd = process.cwd();
			if (root !== cwd) {
				log.debug(`no package.json found in vite root ${root}`);
				return findRootSvelteDependencies(cwd, false);
			}
		}
		log.warn(`no package.json found, findRootSvelteDependencies failed`);
		return [];
	}

	const pkg = parsePkg(root);
	if (!pkg) {
		return [];
	}

	const deps = [
		...Object.keys(pkg.dependencies || {}),
		...Object.keys(pkg.devDependencies || {})
	].filter((dep) => !is_common_without_svelte_field(dep));

	return getSvelteDependencies(deps, root);
}

function getSvelteDependencies(
	deps: string[],
	pkgDir: string,
	path: string[] = []
): SvelteDependency[] {
	const result = [];
	const localRequire = createRequire(`${pkgDir}/package.json`);
	const resolvedDeps = deps
		.map((dep) => resolveSvelteDependency(dep, localRequire))
		.filter(Boolean);
	// @ts-ignore
	for (const { pkg, dir } of resolvedDeps) {
		result.push({ name: pkg.name, pkg, dir, path });
		if (pkg.dependencies) {
			let dependencyNames = Object.keys(pkg.dependencies);
			const circular = dependencyNames.filter((name) => path.includes(name));
			if (circular.length > 0) {
				log.warn.enabled &&
					log.warn(
						`skipping circular svelte dependencies in automated vite optimizeDeps handling`,
						circular.map((x) => path.concat(x).join('>'))
					);
				dependencyNames = dependencyNames.filter((name) => !path.includes(name));
			}
			if (path.length === 3) {
				log.debug.once(`encountered deep svelte dependency tree: ${path.join('>')}`);
			}
			result.push(...getSvelteDependencies(dependencyNames, dir, path.concat(pkg.name)));
		}
	}
	return result;
}

function resolveSvelteDependency(
	dep: string,
	localRequire: NodeRequire
): { dir: string; pkg: Pkg } | void {
	try {
		const pkgJson = `${dep}/package.json`;
		const pkg = localRequire(pkgJson);
		if (!isSvelte(pkg)) {
			return;
		}
		const dir = path.dirname(localRequire.resolve(pkgJson));
		return { dir, pkg };
	} catch (e) {
		log.debug.once(`dependency ${dep} does not export package.json`, e);
		// walk up from default export until we find package.json with name=dep
		try {
			let dir = path.dirname(localRequire.resolve(dep));
			while (dir) {
				const pkg = parsePkg(dir, true);
				if (pkg && pkg.name === dep) {
					if (!isSvelte(pkg)) {
						return;
					}
					log.warn.once(
						`package.json of ${dep} has a "svelte" field but does not include itself in exports field. Please ask package maintainer to update`
					);
					return { dir, pkg };
				}
				const parent = path.dirname(dir);
				if (parent === dir) {
					break;
				}
				dir = parent;
			}
		} catch (e) {
			log.debug.once(`error while trying to find package.json of ${dep}`, e);
		}
	}
	log.debug.once(`failed to resolve ${dep}`);
}

function parsePkg(dir: string, silent = false): Pkg | void {
	const pkgFile = path.join(dir, 'package.json');
	try {
		return JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
	} catch (e) {
		!silent && log.warn.enabled && log.warn(`failed to parse ${pkgFile}`, e);
	}
}

function isSvelte(pkg: Pkg) {
	return !!pkg.svelte;
}

const COMMON_DEPENDENCIES_WITHOUT_SVELTE_FIELD = [
	'@lukeed/uuid',
	'@sveltejs/vite-plugin-svelte',
	'@sveltejs/kit',
	'autoprefixer',
	'cookie',
	'dotenv',
	'esbuild',
	'eslint',
	'jest',
	'mdsvex',
	'postcss',
	'prettier',
	'svelte',
	'svelte-check',
	'svelte-hmr',
	'svelte-preprocess',
	'tslib',
	'typescript',
	'vite'
];
const COMMON_PREFIXES_WITHOUT_SVELTE_FIELD = [
	'@fontsource/',
	'@postcss-plugins/',
	'@rollup/',
	'@sveltejs/adapter-',
	'@types/',
	'@typescript-eslint/',
	'eslint-',
	'jest-',
	'postcss-plugin-',
	'prettier-plugin-',
	'rollup-plugin-',
	'vite-plugin-'
];

/**
 * Test for common dependency names that tell us it is not a package including a svelte field, eg. eslint + plugins.
 *
 * This speeds up the find process as we don't have to try and require the package.json for all of them
 *
 * @param dependency {string}
 * @returns {boolean} true if it is a dependency without a svelte field
 */
function is_common_without_svelte_field(dependency: string): boolean {
	return (
		COMMON_DEPENDENCIES_WITHOUT_SVELTE_FIELD.includes(dependency) ||
		COMMON_PREFIXES_WITHOUT_SVELTE_FIELD.some(
			(prefix) =>
				prefix.startsWith('@')
					? dependency.startsWith(prefix)
					: dependency.substring(dependency.lastIndexOf('/') + 1).startsWith(prefix) // check prefix omitting @scope/
		)
	);
}

export interface SvelteDependency {
	name: string;
	dir: string;
	pkg: Pkg;
	path: string[];
}

export interface Pkg {
	name: string;
	svelte?: string;
	dependencies?: DependencyList;
	devDependencies?: DependencyList;
	[key: string]: any;
}

export interface DependencyList {
	[key: string]: string;
}
