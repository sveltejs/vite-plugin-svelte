import { getText, isBuild, readVitePrebundleMetadata } from '~utils';

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
