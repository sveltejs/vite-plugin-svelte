import { log } from './log';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

export function findSvelteDependencies(root: string, cwdFallback = true): SvelteDependency[] {
	log.debug(`findSvelteDependencies: searching svelte dependencies in ${root}`);
	const pkgFile = path.join(root, 'package.json');
	if (!fs.existsSync(pkgFile)) {
		if (cwdFallback) {
			const cwd = process.cwd();
			if (root !== cwd) {
				log.debug(`no package.json found in vite root ${root}`);
				return findSvelteDependencies(cwd, false);
			}
		}
		log.debug(`no package.json found, search failed`);
		return [];
	}

	const pkg = parsePkg(root);
	if (!pkg) {
		return [];
	}

	const deps = [
		...Object.keys(pkg.dependencies || {}),
		...Object.keys(pkg.devDependencies || {})
	].filter((dep) => !excludeFromScan(dep));

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
				log.warn.once(`encountered deep svelte dependency tree ${path.join('>')}`);
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
		let dir = path.dirname(localRequire.resolve(dep));
		while (dir) {
			const pkg = parsePkg(dir, true);
			if (pkg && pkg.name === dep) {
				if (!isSvelte(pkg)) {
					return;
				}
				log.warn(`package ${dep} has a "svelte" field but does not export it's package.json`);
				return { dir, pkg };
			}
			const parent = path.dirname(dir);
			if (parent === dir) {
				break;
			}
			dir = parent;
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

const EXCLUDE = [
	'@sveltejs/vite-plugin-svelte',
	'@sveltejs/kit',
	'autoprefixer',
	'dotenv',
	'esbuild',
	'eslint',
	'jest',
	'postcss',
	'prettier',
	'svelte',
	'svelte-hmr',
	'svelte-preprocess',
	'typescript',
	'vite'
];
const EXCLUDE_PREFIX = [
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

function excludeFromScan(dep: string): boolean {
	return (
		EXCLUDE.some((ex) => dep === ex) ||
		EXCLUDE_PREFIX.some((ex) =>
			ex.startsWith('@')
				? dep.startsWith(ex)
				: dep.substring(dep.lastIndexOf('/') + 1).startsWith(ex)
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
