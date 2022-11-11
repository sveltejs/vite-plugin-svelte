import { promises as fs } from 'fs';
import path from 'path';
import { ResolvedOptions } from './options';

// List of options that changes the prebundling result
const PREBUNDLE_SENSITIVE_OPTIONS: (keyof ResolvedOptions)[] = [
	'compilerOptions',
	'configFile',
	'experimental',
	'extensions',
	'ignorePluginPreprocessors',
	'preprocess'
];

/**
 * @returns Whether the Svelte metadata has changed
 */
export async function saveSvelteMetadata(cacheDir: string, options: ResolvedOptions) {
	const svelteMetadata = generateSvelteMetadata(options);
	const svelteMetadataPath = path.resolve(cacheDir, '_svelte_metadata.json');

	const currentSvelteMetadata = JSON.stringify(svelteMetadata, (_, value) => {
		// Handle preprocessors
		return typeof value === 'function' ? value.toString() : value;
	});

	let existingSvelteMetadata: string | undefined;
	try {
		existingSvelteMetadata = await fs.readFile(svelteMetadataPath, 'utf8');
	} catch {
		// ignore
	}

	await fs.mkdir(cacheDir, { recursive: true });
	await fs.writeFile(svelteMetadataPath, currentSvelteMetadata);
	return currentSvelteMetadata !== existingSvelteMetadata;
}

function generateSvelteMetadata(options: ResolvedOptions) {
	const metadata: Record<string, any> = {};
	for (const key of PREBUNDLE_SENSITIVE_OPTIONS) {
		metadata[key] = options[key];
	}
	return metadata;
}

// vite optimizeDeps.exclude works for subpackages too
// see https://github.com/vitejs/vite/blob/c87763c1418d1ba876eae13d139eba83ac6f28b2/packages/vite/src/node/optimizer/scan.ts#L293
export function isOptimizeExcluded(dep: string, exclude?: string[]): boolean {
	return !!exclude?.some((e) => dep === e || dep.startsWith(`${e}/`));
}

// include can contain `a > b`  entries, so we have to test the last segment too
export function isOptimizeIncluded(dep: string, include?: string[]): boolean {
	return !!include?.some((e) => {
		if (e === dep) {
			return true;
		}
		const lastArrow = e.lastIndexOf('>');
		return lastArrow > -1 && e.slice(lastArrow + 1).trim() === dep;
	});
}
