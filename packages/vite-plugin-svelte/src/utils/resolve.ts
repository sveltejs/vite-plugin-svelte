import path from 'path';
import { createRequire } from 'module';
import { is_common_without_svelte_field, resolveDependencyData } from './dependencies';

export function resolveViaPackageJsonSvelte(importee: string, importer?: string): string | void {
	if (importer && isBareImport(importee) && !is_common_without_svelte_field(importee)) {
		const localRequire = createRequire(importer);
		const pkgData = resolveDependencyData(importee, localRequire);
		if (pkgData) {
			const { pkg, dir } = pkgData;
			if (pkg.svelte) {
				return path.resolve(dir, pkg.svelte);
			}
		} else {
			throw new Error(`failed to resolve package.json of ${importee} imported by ${importer}`);
		}
	}
}

function isBareImport(importee: string): boolean {
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
