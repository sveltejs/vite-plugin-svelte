import fs from 'fs';
import path from 'path';
import { getText, isBuild } from '../../testUtils';

test('should render component imported via svelte field in package.json', async () => {
	expect(await getText('#test-id')).toBe('svelte field works');
});

if (!isBuild) {
	test('should optimize nested deps of excluded svelte deps', () => {
		const vitePrebundleMetadata = path.resolve(__dirname, '../node_modules/.vite/_metadata.json');
		const metadataFile = fs.readFileSync(vitePrebundleMetadata, 'utf8');
		const metadata = JSON.parse(metadataFile);
		const optimizedPaths = Object.keys(metadata.optimized);
		expect(optimizedPaths).not.toContain('e2e-test-dep-svelte-nested');
		expect(optimizedPaths).not.toContain('e2e-test-dep-svelte-simple');
		expect(optimizedPaths).toContain('e2e-test-dep-svelte-nested > e2e-test-dep-cjs-and-esm');
		expect(optimizedPaths).toContain(
			'e2e-test-dep-svelte-nested > e2e-test-dep-svelte-simple > e2e-test-dep-cjs-only'
		);
	});
}
