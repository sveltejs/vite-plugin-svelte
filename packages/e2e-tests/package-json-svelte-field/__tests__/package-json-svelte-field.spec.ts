import fs from 'fs';
import path from 'path';
import { getText, isBuild } from '~utils';

test('should render component imported via svelte field in package.json', async () => {
	expect(await getText('#test-id')).toBe('svelte field works');
});

if (!isBuild) {
	test('should optimize nested cjs deps of excluded svelte deps', () => {
		const metadataFile = readVitePrebundleMetadata();
		const metadata = JSON.parse(metadataFile);
		const optimizedPaths = Object.keys(metadata.optimized);
		expect(optimizedPaths).not.toContain('e2e-test-dep-svelte-nested');
		expect(optimizedPaths).not.toContain('e2e-test-dep-svelte-simple');
		expect(optimizedPaths).toContain(
			'e2e-test-dep-svelte-nested > e2e-test-dep-svelte-simple > e2e-test-dep-cjs-only'
		);
	});
}

function readVitePrebundleMetadata() {
	const metadataPaths = [
		'../node_modules/.vite/_metadata.json',
		'../node_modules/.vite/deps/_metadata.json' // vite 2.9
	];
	for (const metadataPath of metadataPaths) {
		try {
			const vitePrebundleMetadata = path.resolve(__dirname, metadataPath);
			const metadataFile = fs.readFileSync(vitePrebundleMetadata, 'utf8');
			return metadataFile;
		} catch {
			// ignore
		}
	}
	throw new Error('Unable to find vite prebundle metadata');
}
