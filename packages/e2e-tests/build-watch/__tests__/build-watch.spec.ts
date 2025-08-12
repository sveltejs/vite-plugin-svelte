import {
	isBuildWatch,
	getEl,
	getText,
	editFileAndWaitForBuildWatchComplete,
	hmrCount,
	untilMatches,
	sleep,
	getColor,
	browserLogs,
	e2eServer,
	getWatchErrors
} from '~utils';

import * as vite from 'vite';
// @ts-ignore
const isRolldownVite = !!vite.rolldownVersion;

describe.runIf(isBuildWatch)('build-watch', () => {
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

	describe('edit files', () => {
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
			expect(getWatchErrors(), 'error log of `build --watch` is not empty').toEqual([]);
		});

		test('should apply js change in HmrTest.svelte ', async () => {
			// update script, change label value
			await updateHmrTest((content) =>
				content.replace("const label = 'hmr-test'", "const label = 'hmr-test-updated'")
			);
			expect(await getText('#hmr-test-1 .label')).toBe('hmr-test-updated');
			expect(await getText('#hmr-test-2 .label')).toBe('hmr-test-updated');
			expect(getWatchErrors(), 'error log of `build --watch` is not empty').toEqual([]);
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
			expect(getWatchErrors(), 'error log of `build --watch` is not empty').toEqual([]);
		});

		test('should reset state of store when editing hmr-stores.js', async () => {
			// change state
			await (await getEl('#hmr-test-2 .increment')).click();
			await sleep(50);
			expect(await getText('#hmr-test-2 .counter')).toBe('1');
			await updateStore((content) => `${content}\n/*trigger change*/\n`);
			// counter state is reset
			expect(await getText('#hmr-test-2 .counter')).toBe('0');
			expect(getWatchErrors(), 'error log of `build --watch` is not empty').toEqual([]);
		});

		test('should work when editing script context="module"', async () => {
			expect(await getText('#hmr-with-context')).toContain('x=0 y=1 slot=1');
			expect(await getText('#hmr-without-context')).toContain('x=0 y=1 slot=');
			expect(hmrCount('UsingNamed.svelte'), 'updates for UsingNamed.svelte').toBe(0);
			expect(hmrCount('UsingDefault.svelte'), 'updates for UsingDefault.svelte').toBe(0);
			await updateModuleContext((content) => content.replace('y = 1', 'y = 2'));
			expect(await getText('#hmr-with-context')).toContain('x=0 y=2 slot=2');
			expect(await getText('#hmr-without-context')).toContain('x=0 y=2 slot=');
			expect(hmrCount('UsingNamed.svelte'), 'updates for UsingNamed.svelte').toBe(0);
			expect(hmrCount('UsingDefault.svelte'), 'updates for UsingDefault.svelte').toBe(0);
			expect(getWatchErrors(), 'error log of `build --watch` is not empty').toEqual([]);
		});
	});
});
