import { log } from './log';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

export function findSvelteDependencies(
	root: string,
	cwdFallback = true
): Record<string, SvelteDependency[]> {
	log.debug(`findSvelteDependencies: searching svelte dependencies in ${root}`);

	const pkgFile = path.join(root, 'package.json');
	if (!fs.existsSync(pkgFile)) {
		if (cwdFallback) {
			const cwd = process.cwd();
			if (root !== cwd) {
				log.debug(`no package.json found in  vite root ${root}`);
				return findSvelteDependencies(cwd, false);
			}
		}
		log.debug(`no package.json found, search failed`);
		return {};
	}

	const stack = [{ dir: root, depPath: [] as string[] }];
	// name->SvelteDependency[]
	const result: Record<string, SvelteDependency[]> = {};
	const doNotScan = new Set<string>([
		'svelte',
		'vite',
		'@sveltejs/kit',
		'@sveltejs/vite-plugin-svelte'
	]);

	while (stack.length > 0) {
		const { dir, depPath } = stack.shift()!;
		const pkg = parsePkg(dir);
		if (!pkg) {
			continue;
		}
		if (dir !== root) {
			if (!isSvelte(pkg)) {
				doNotScan.add(pkg.name);
				continue;
			}
			if (!result[pkg.name]) {
				result[pkg.name] = [];
			}
			result[pkg.name].push({ name: pkg.name, pkg, dir, paths: [depPath] });
		}

		const pkgRequire = createRequire(dir);
		const deps = [
			...Object.keys(pkg.dependencies || {}),
			...Object.keys(pkg.devDependencies || {})
		];
		const resolvedDeps = deps.map((dep) => ({ name: dep, dir: getDependencyDir(pkgRequire, dep) }));
		const nestedDepPath = [...depPath, pkg.name];
		for (const dep of resolvedDeps) {
			if (doNotScan.has(dep.name)) {
				continue;
			}
			const existingResult = result[dep.name]?.find((x) => x.dir === dep.dir);
			if (existingResult) {
				// we already have this, just add an additional path to it
				existingResult.paths.push(nestedDepPath);
			} else {
				stack.push({ dir: dep.dir, depPath: nestedDepPath });
			}
		}
	}
	return result;
}

// TODO better implementation
function getDependencyDir(pkgRequire: NodeRequire, dep: string) {
	try {
		return path.dirname(pkgRequire.resolve(path.join(dep, 'package.json')));
	} catch (e) {
		// does not export package.json, walk up parent directories of default export until we find the one named like the package
		let dir = path.dirname(pkgRequire.resolve(path.join(dep)));
		while (dir && path.basename(dir) !== dep) {
			const parent = path.dirname(dir);
			if (parent !== dir) {
				dir = parent;
			}
		}
		return dir;
	}
}

function parsePkg(dir: string) {
	const pkgFile = path.join(dir, 'package.json');
	try {
		return JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
	} catch (e) {
		log.warn(`failed to parse ${pkgFile}`, e);
		return null;
	}
}

function isSvelte(pkg: Pkg) {
	return pkg.svelte || pkg.peerDependencies?.svelte;
}

export interface SvelteDependency {
	name: string;
	dir: string;
	pkg: Pkg;
	paths: string[][];
}

export interface Pkg {
	name: string;
	svelte?: string;
	dependencies?: DependencyList;
	peerDependencies?: DependencyList;
	devDependencies?: DependencyList;
	[key: string]: any;
}

export interface DependencyList {
	[key: string]: string;
}
