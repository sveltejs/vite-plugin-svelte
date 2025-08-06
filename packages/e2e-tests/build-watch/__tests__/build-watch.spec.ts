import {
	isBuildWatch,
	getEl,
	getText,
	editFileAndWaitForBuildWatchComplete,
	hmrCount,
	untilMatches,
	sleep,
	getColor,
	editFile,
	addFile,
	removeFile,
	editViteConfig,
	browserLogs,
	waitForBuildWatchAndPageReload
} from '~utils';

test('should render App', async () => {
	expect(await getText('#app-header')).toBe('Test-App');
});

test('should render static import', async () => {
	expect(await getText('#static-import .label')).toBe('static-import');
});

test('should render dependency import', async () => {
	expect(await getText('#dependency-import .label')).toBe('dependency-import');
});

test('should render dynamic import', async () => {
	expect(await getEl('#dynamic-import')).toBe(null);
	const dynamicImportButton = await getEl('#button-import-dynamic');
	expect(dynamicImportButton).toBeDefined();
	await dynamicImportButton.click();
	await untilMatches(
		() => getText('#dynamic-import .label'),
		'dynamic-import',
		'dynamic import loaded after click'
	);
});

test('should not have failed requests', async () => {
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
});

test('should respect transforms', async () => {
	expect(await getText('#js-transform')).toBe('Hello world');
	expect(await getColor('#css-transform')).toBe('red');
});

if (isBuildWatch) {
	describe('build --watch', () => {
		const updateHmrTest = editFileAndWaitForBuildWatchComplete.bind(
			null,
			'src/components/HmrTest.svelte'
		);
		const updateModuleContext = editFileAndWaitForBuildWatchComplete.bind(
			null,
			'src/components/partial-hmr/ModuleContext.svelte'
		);
		const updateApp = editFileAndWaitForBuildWatchComplete.bind(null, 'src/App.svelte');
		const updateStore = editFileAndWaitForBuildWatchComplete.bind(null, 'src/stores/hmr-stores.js');

		test('should have expected initial state', async () => {
			// initial state, both counters 0, both labels red
			expect(await getText('#hmr-test-1 .counter')).toBe('0');
			expect(await getText('#hmr-test-2 .counter')).toBe('0');
			expect(await getText('#hmr-test-1 .label')).toBe('hmr-test');
			expect(await getText('#hmr-test-2 .label')).toBe('hmr-test');
			expect(await getColor('#hmr-test-1 .label')).toBe('red');
			expect(await getColor('#hmr-test-2 .label')).toBe('red');
		});

		test('should have working increment button', async () => {
			// increment counter of one instance to have local state to verify after build updates
			await (await getEl('#hmr-test-1 .increment')).click();
			await sleep(50);

			// counter1 = 1, counter2 = 0
			expect(await getText('#hmr-test-1 .counter')).toBe('1');
			expect(await getText('#hmr-test-2 .counter')).toBe('0');
		});

		test('should apply css changes in HmrTest.svelte', async () => {
			// update style, change label color from red to green
			await updateHmrTest((content) => content.replace('color: red', 'color: green'));

			// color should have changed
			expect(await getColor('#hmr-test-1 .label')).toBe('green');
			expect(await getColor('#hmr-test-2 .label')).toBe('green');
		});

		test('should apply js change in HmrTest.svelte ', async () => {
			// update script, change label value
			await updateHmrTest((content) =>
				content.replace("const label = 'hmr-test'", "const label = 'hmr-test-updated'")
			);
			expect(await getText('#hmr-test-1 .label')).toBe('hmr-test-updated');
			expect(await getText('#hmr-test-2 .label')).toBe('hmr-test-updated');
		});

		test('should reset state of external store used by HmrTest.svelte when editing App.svelte', async () => {
			// update App, add a new instance of HmrTest
			await updateApp((content) =>
				content.replace(
					'<!-- HMR-TEMPLATE-INJECT -->',
					'<HmrTest id="hmr-test-3"/>\n<!-- HMR-TEMPLATE-INJECT -->'
				)
			);
			// counter state is reset
			expect(await getText('#hmr-test-1 .counter')).toBe('0');
			expect(await getText('#hmr-test-2 .counter')).toBe('0');
			// a third instance has been added
			expect(await getText('#hmr-test-3 .counter')).toBe('0');
		});

		test('should reset state of store when editing hmr-stores.js', async () => {
			// change state
			await (await getEl('#hmr-test-2 .increment')).click();
			await sleep(50);
			expect(await getText('#hmr-test-2 .counter')).toBe('1');
			await updateStore((content) => `${content}\n/*trigger change*/\n`);
			// counter state is reset
			expect(await getText('#hmr-test-2 .counter')).toBe('0');
		});

		test('should work when editing script context="module"', async () => {
			expect(await getText('#hmr-with-context')).toContain('x=0 y=1 slot=1');
			expect(await getText('#hmr-without-context')).toContain('x=0 y=1 slot=');
			expect(hmrCount('UsingNamed.svelte'), 'updates for UsingNamed.svelte').toBe(0);
			expect(hmrCount('UsingDefault.svelte'), 'updates for UsingDefault.svelte').toBe(0);
			await updateModuleContext((content) => content.replace('y = 1', 'y = 2'));
			expect(await getText('#hmr-with-context')).toContain('x=0 y=2 slot=2');
			expect(await getText('#hmr-without-context')).toContain('x=0 y=2 slot=');
			expect(hmrCount('UsingNamed.svelte'), 'updates for UsingNamed.svelte').toBe(1);
			expect(hmrCount('UsingDefault.svelte'), 'updates for UsingDefault.svelte').toBe(0);
		});

		test('should work with emitCss: false in vite config', async () => {
			await editViteConfig((c) => c.replace('svelte()', 'svelte({emitCss:false})'));
			expect(await getText('#hmr-test-1 .counter')).toBe('0');
			expect(await getColor('#hmr-test-1 .label')).toBe('green');
			await (await getEl('#hmr-test-1 .increment')).click();
			await sleep(50);
			expect(await getText('#hmr-test-1 .counter')).toBe('1');
			await updateHmrTest((content) => content.replace('color: green', 'color: red'));
			expect(await getColor('#hmr-test-1 .label')).toBe('red');
			// counter value is reset
			expect(await getText('#hmr-test-1 .counter')).toBe('0');
		});

		test('should work with emitCss: false in svelte config', async () => {
			addFile('svelte.config.js', 'export default {vitePlugin:{emitCss:false}}');
			await waitForBuildWatchAndPageReload();
			expect(await getColor('#hmr-test-1 .label')).toBe('red');
			removeFile('svelte.config.js');
			await waitForBuildWatchAndPageReload();
		});

		test('should detect changes in svelte config and rebuild', async () => {
			const injectPreprocessor = ({ content, filename }) => {
				if (filename && filename.includes('App.svelte')) {
					return {
						code: content.replace(
							'<!-- HMR-TEMPLATE-INJECT -->',
							'<div id="preprocess-inject">Injected</div>\n<!-- HMR-TEMPLATE-INJECT -->'
						)
					};
				}
			};
			await addFile(
				'svelte.config.js',
				`export default {
			  preprocess:[{markup:${injectPreprocessor.toString()}}]};`
			);
			await waitForBuildWatchAndPageReload();
			expect(await getText('#preprocess-inject')).toBe('Injected');
			expect(await getText('#hmr-test-1 .counter')).toBe('0');
			expect(await getColor('#hmr-test-1 .label')).toBe('red');
			await (await getEl('#hmr-test-1 .increment')).click();
			await sleep(50);
			expect(await getText('#hmr-test-1 .counter')).toBe('1');
			await updateHmrTest((content) => content.replace('color: red', 'color: green'));
			expect(await getColor('#hmr-test-1 .label')).toBe('green');
			expect(await getText('#hmr-test-1 .counter')).toBe('0');
			await editFile('svelte.config.js', (content) =>
				content
					.replace('preprocess-inject', 'preprocess-inject-2')
					.replace('Injected', 'Injected 2')
			);
			await waitForBuildWatchAndPageReload();
			expect(await getText('#preprocess-inject-2')).toBe('Injected 2');
			expect(await getEl('#preprocess-inject')).toBe(null);
			expect(await getColor('#hmr-test-1 .label')).toBe('green');
			expect(await getText('#hmr-test-1 .counter')).toBe('0');
			await (await getEl('#hmr-test-1 .increment')).click();
			await sleep(50);
			expect(await getText('#hmr-test-1 .counter')).toBe('1');
			await updateHmrTest((content) => content.replace('color: green', 'color: red'));
			expect(await getColor('#hmr-test-1 .label')).toBe('red');
			expect(await getText('#hmr-test-1 .counter')).toBe('0');
			await removeFile('svelte.config.js');
			await waitForBuildWatchAndPageReload();
			expect(await getEl('#preprocess-inject-2')).toBe(null);
			expect(await getEl('#preprocess-inject')).toBe(null);
			expect(await getColor('#hmr-test-1 .label')).toBe('red');
			expect(await getText('#hmr-test-1 .counter')).toBe('0');
		});
	});
}
