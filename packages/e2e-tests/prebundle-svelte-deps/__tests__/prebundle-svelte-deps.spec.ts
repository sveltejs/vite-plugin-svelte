import {
	browserLogs,
	editFile,
	getText,
	isBuild,
	readVitePrebundleMetadata,
	waitForServerRestartAndPageReload
} from '~utils';

async function expectPageToWork() {
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
	expect(await getText('#hybrid .label')).toBe('dependency-import');
	expect(await getText('#nested #message')).toBe('nested');
	expect(await getText('#nested #cjs-and-esm')).toBe('esm');
	expect(await getText('#api-only')).toBe('api loaded: true');
	expect(await getText('#simple .label')).toBe('dependency-import');
	expect(await getText('#exports-simple .label')).toBe('dependency-import');
}

if (!isBuild) {
	test('page works with pre-bundling enabled', async () => {
		await expectPageToWork();
	});
	test('should optimize svelte dependencies', () => {
		const metadataFile = readVitePrebundleMetadata();
		const metadata = JSON.parse(metadataFile);
		const optimizedPaths = Object.keys(metadata.optimized);
		expect(optimizedPaths).toContain('e2e-test-dep-svelte-simple');
		expect(optimizedPaths).toContain('e2e-test-dep-svelte-exports-simple');
		expect(optimizedPaths).toContain('e2e-test-dep-svelte-api-only');
		expect(optimizedPaths).toContain('e2e-test-dep-svelte-nested');
	});

	test('should not optimize excluded svelte dependencies', () => {
		const metadataFile = readVitePrebundleMetadata();
		const metadata = JSON.parse(metadataFile);
		const optimizedPaths = Object.keys(metadata.optimized);
		expect(optimizedPaths).not.toContain('e2e-test-dep-scss-only');
		expect(optimizedPaths).not.toContain('e2e-test-dep-svelte-hybrid');
		expect(optimizedPaths).toContain('e2e-test-dep-svelte-hybrid > e2e-test-dep-cjs-only');
	});

	test('page works with pre-bundling disabled', async () => {
		editFile('svelte.config.js', (c) =>
			c.replace('prebundleSvelteLibraries: true', 'prebundleSvelteLibraries: false')
		);
		await waitForServerRestartAndPageReload();
		await expectPageToWork();
		const metadataFile = readVitePrebundleMetadata();
		const metadata = JSON.parse(metadataFile);
		const optimizedPaths = Object.keys(metadata.optimized);
		expect(optimizedPaths).not.toContain('e2e-test-dep-svelte-simple');
		expect(optimizedPaths).not.toContain('e2e-test-dep-svelte-hybrid');

		// this is a bit surprising, we always include js-libraries using svelte
		expect(optimizedPaths).toContain('e2e-test-dep-svelte-api-only');

		expect(optimizedPaths).toContain('e2e-test-dep-svelte-hybrid > e2e-test-dep-cjs-only');
		expect(optimizedPaths).toContain('e2e-test-dep-svelte-simple > e2e-test-dep-cjs-only');
		expect(optimizedPaths).toContain(
			'e2e-test-dep-svelte-nested > e2e-test-dep-svelte-simple > e2e-test-dep-cjs-only'
		);
	});
} else {
	test('page works', async () => {
		await expectPageToWork();
	});
}
