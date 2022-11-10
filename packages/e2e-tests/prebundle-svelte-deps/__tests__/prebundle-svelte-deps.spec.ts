import { browserLogs, getText, isBuild, readVitePrebundleMetadata } from '~utils';

test('should not have failed requests', async () => {
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
});

test('should render Hybrid import', async () => {
	expect(await getText('#hybrid .label')).toBe('dependency-import');
});

test('should render Simple import', async () => {
	expect(await getText('#hybrid .label')).toBe('dependency-import');
});

test('should render Nested import', async () => {
	expect(await getText('#nested #message')).toBe('nested');
	expect(await getText('#nested #cjs-and-esm')).toBe('esm');
});

test('should render api-only import', async () => {
	expect(await getText('#api-only')).toBe('api loaded: true');
});

if (!isBuild) {
	test('should optimize svelte dependencies and their cjs subdependencies', () => {
		const metadataFile = readVitePrebundleMetadata();
		const metadata = JSON.parse(metadataFile);
		const optimizedPaths = Object.keys(metadata.optimized);
		expect(optimizedPaths).toContain('e2e-test-dep-svelte-simple');
		expect(optimizedPaths).toContain('e2e-test-dep-svelte-hybrid');
		expect(optimizedPaths).toContain('e2e-test-dep-svelte-api-only');
		expect(optimizedPaths).toContain('e2e-test-dep-svelte-hybrid > e2e-test-dep-cjs-only');
		expect(optimizedPaths).toContain(
			'e2e-test-dep-svelte-nested > e2e-test-dep-svelte-simple > e2e-test-dep-cjs-only'
		);
	});

	test('should not optimize excluded svelte dependencies', () => {
		const metadataFile = readVitePrebundleMetadata();
		const metadata = JSON.parse(metadataFile);
		const optimizedPaths = Object.keys(metadata.optimized);
		expect(optimizedPaths).not.toContain('e2e-test-dep-svelte-nested');
	});
}
