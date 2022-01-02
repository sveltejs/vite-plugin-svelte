import fs from 'fs';
import path from 'path';
import { optimizeDeps, ResolvedConfig } from 'vite';
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

export async function handleOptimizeDeps(options: ResolvedOptions, viteConfig: ResolvedConfig) {
	if (!options.experimental.prebundleSvelteLibraries || !viteConfig.cacheDir) return;

	const viteMetadataPath = path.resolve(viteConfig.cacheDir, '_metadata.json');

	if (!fs.existsSync(viteMetadataPath)) return;

	const svelteMetadataPath = path.resolve(viteConfig.cacheDir, '_svelte_metadata.json');
	const currentSvelteMetadata = JSON.stringify(generateSvelteMetadata(options), (_, value) => {
		return typeof value === 'function' ? value.toString() : value;
	});

	if (fs.existsSync(svelteMetadataPath)) {
		const existingSvelteMetadata = fs.readFileSync(svelteMetadataPath, 'utf8');
		if (existingSvelteMetadata === currentSvelteMetadata) return;
	}

	await optimizeDeps(viteConfig, true);
	fs.writeFileSync(svelteMetadataPath, currentSvelteMetadata);
}

function generateSvelteMetadata(options: ResolvedOptions) {
	const metadata: Record<string, any> = {};
	for (const key of PREBUNDLE_SENSITIVE_OPTIONS) {
		metadata[key] = options[key];
	}
	return metadata;
}
