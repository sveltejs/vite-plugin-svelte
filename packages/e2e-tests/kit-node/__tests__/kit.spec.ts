import {
	editFile,
	editFileAndWaitForHmrComplete,
	getColor,
	getEl,
	getText,
	isBuild,
	readFileContent,
	sleep,
	untilUpdated,
	waitForNavigation
} from '../../testUtils';

import fetch from 'node-fetch';
import path from 'path';

describe('kit-node', () => {
	describe('index route', () => {
		it('should hydrate', async () => {
			// check content before hydration
			expect(await getText('h1')).toBe('Hello world!');
			// sometimes jest or playwright is too slow and hydration already kicked in
			// so the next 2 expectations might flake. disable until we switch to a faster setup
			// expect(await getText('#load')).toBe('SERVER_LOADED');
			// expect(await getText('#mount')).toBe('BEFORE_MOUNT');
			expect(await getText('#i18n')).toBe('WELCOME');
			expect(await getText('#env')).toBe('FOOBARENV');
			// check that inline script added the initial node markers
			expect(await page.$eval('#load', (e) => e['__initialNode'])).toBe(true);
			expect(await page.$eval('#mount', (e) => e['__initialNode'])).toBe(true);

			// also get page as text to confirm
			const html = await (await fetch(page.url())).text();
			expect(html).toMatch('Hello world!');
			expect(html).toMatch('SERVER_LOADED');
			expect(html).toMatch('BEFORE_MOUNT');
			expect(html).toMatch('WELCOME');
			expect(html).toMatch('FOOBARENV');

			// wait a bit for hydration to kick in
			await sleep(550);

			// check hydrated content
			expect(await getText('#load')).toBe('CLIENT_LOADED');
			expect(await getText('#mount')).toBe('AFTER_MOUNT');

			// check that it did not replace the dom elements with new ones
			expect(await page.$eval('#load', (e) => e['__initialNode'])).toBe(true);
			expect(await page.$eval('#mount', (e) => e['__initialNode'])).toBe(true);

			if (isBuild) {
				// TODO additional testing needed here once vite-plugin-svelte implements indexHtmlTransform hook
			}
		});

		it('should have correct styles applied', async () => {
			if (isBuild) {
				expect(await getColor('h1')).toBe('rgb(255, 62, 0)');
			} else {
				// During dev, the CSS is loaded from async chunk and we may have to wait
				// when the test runs concurrently.
				await untilUpdated(() => getColor('h1'), 'rgb(255, 62, 0)');
			}
		});

		it('should increase count on click', async () => {
			const button = await getEl('button');
			expect(await getText(button)).toBe('Clicks: 0');
			await button.click();
			expect(await getText(button)).toBe('Clicks: 1');
		});

		it('should not have failed requests', async () => {
			// should have no 404s
			browserLogs.forEach((msg) => {
				expect(msg).not.toMatch('404');
			});
		});

		it('should load dynamic import in onMount', async () => {
			// expect log to contain message with dynamic import value from onMount
			expect(browserLogs.some((x) => x === 'onMount dynamic imported isSSR: false')).toBe(true);
		});

		test('should respect transforms', async () => {
			expect(await getText('#js-transform')).toBe('Hello world');
			expect(await getColor('#css-transform')).toBe('red');
		});

		if (isBuild) {
			it('should not include dynamic import from onmount in ssr output', async () => {
				const serverManifest = JSON.parse(
					readFileContent(path.join('.svelte-kit', 'output', 'server', 'manifest.json'))
				);
				const includesClientOnlyModule = Object.keys(serverManifest).some((key: string) =>
					key.includes('client-only-module')
				);
				expect(includesClientOnlyModule).toBe(false);
			});
			it('should include dynamic import from onmount in client output', async () => {
				const clientManifest = JSON.parse(
					readFileContent(path.join('.svelte-kit', 'output', 'client', '_app', 'manifest.json'))
				);
				const includesClientOnlyModule = Object.keys(clientManifest).some((key: string) =>
					key.includes('client-only-module')
				);
				expect(includesClientOnlyModule).toBe(true);
			});
		}

		if (!isBuild) {
			describe('hmr', () => {
				const updateIndexSvelte = editFileAndWaitForHmrComplete.bind(
					null,
					'src/routes/index.svelte'
				);

				it('should render additional html', async () => {
					// add div 1
					expect(await getEl('#hmr-test')).toBe(null);
					await updateIndexSvelte((content) =>
						content.replace(
							'<!-- HMR-TEMPLATE-INJECT -->',
							'<div id="hmr-test">foo</div>\n<!-- HMR-TEMPLATE-INJECT -->'
						)
					);
					await expect(await getText(`#hmr-test`)).toBe('foo');

					// add div 2
					expect(await getEl('#hmr-test2')).toBe(null);
					await updateIndexSvelte((content) =>
						content.replace(
							'<!-- HMR-TEMPLATE-INJECT -->',
							'<div id="hmr-test2">bar</div>\n<!-- HMR-TEMPLATE-INJECT -->'
						)
					);
					await expect(await getText(`#hmr-test`)).toBe('foo');
					await expect(await getText(`#hmr-test2`)).toBe('bar');
					// remove div 1
					await updateIndexSvelte((content) =>
						content.replace('<div id="hmr-test">foo</div>\n', '')
					);
					await expect(await getText(`#hmr-test`)).toBe(null);
					await expect(await getText(`#hmr-test2`)).toBe('bar');
				});

				it('should render additional child components', async () => {
					let buttons = await page.$$('button');
					expect(buttons).toHaveLength(1);
					expect(await getText(buttons[0])).toBe('Clicks: 0');
					await updateIndexSvelte((content) =>
						content.replace(
							'<!-- HMR-TEMPLATE-INJECT -->',
							'<Counter id="hmr-test-counter"/>\n<!-- HMR-TEMPLATE-INJECT -->'
						)
					);
					buttons = await page.$$('button');
					expect(buttons).toHaveLength(2);
					expect(await getText(buttons[0])).toBe('Clicks: 0');
					expect(await getText(buttons[1])).toBe('Clicks: 0');
					await buttons[1].click();
					expect(await getText(buttons[0])).toBe('Clicks: 0');
					expect(await getText(buttons[1])).toBe('Clicks: 1');
					await updateIndexSvelte((content) =>
						content.replace('<Counter id="hmr-test-counter"/>\n', '')
					);
					buttons = await page.$$('button');
					expect(buttons).toHaveLength(1);
					expect(await getText(buttons[0])).toBe('Clicks: 0');
				});

				it('should apply changed styles', async () => {
					expect(await getColor(`h1`)).toBe('rgb(255, 62, 0)');
					await updateIndexSvelte((content) => content.replace('color: #ff3e00', 'color: blue'));
					expect(await getColor(`h1`)).toBe('blue');
					await updateIndexSvelte((content) => content.replace('color: blue', 'color: green'));
					expect(await getColor(`h1`)).toBe('green');
				});

				it('should serve changes even after page reload', async () => {
					expect(await getColor(`h1`)).toBe('green');
					expect(await getText(`#hmr-test2`)).toBe('bar');
					await page.reload({ waitUntil: 'networkidle' });
					expect(await getColor(`h1`)).toBe('green');
					await expect(await getText(`#hmr-test2`)).toBe('bar');
				});

				describe('child component update', () => {
					const updateChild = editFileAndWaitForHmrComplete.bind(null, 'src/lib/Child.svelte');
					const updateCounter = editFileAndWaitForHmrComplete.bind(null, 'src/lib/Counter.svelte');
					it('should preserve dom order', async () => {
						expect(await getText('#before-child')).toBe('before-child');
						expect(await getText('#test-child')).toBe('test-child');
						expect(await getText('#after-child')).toBe('after-child');
						expect(await getEl('#before-child + #test-child')).not.toBe(null);
						expect(await getEl('#test-child + #after-child')).not.toBe(null);
						await updateChild((content) =>
							content.replace('<!-- HMR-TEMPLATE-INJECT -->', '-foo<!-- HMR-TEMPLATE-INJECT -->')
						);
						expect(await getText('#before-child')).toBe('before-child');
						expect(await getText('#test-child')).toBe('test-child-foo');
						expect(await getText('#after-child')).toBe('after-child');
						expect(await getEl('#before-child + #test-child')).not.toBe(null);
						expect(await getEl('#test-child + #after-child')).not.toBe(null);
					});
					it('should render additional html', async () => {
						// add div 1
						expect(await getEl('#hmr-test3')).toBe(null);
						await updateCounter((content) =>
							content.replace(
								'<!-- HMR-TEMPLATE-INJECT -->',
								'<div id="hmr-test3">foo</div>\n<!-- HMR-TEMPLATE-INJECT -->'
							)
						);
						await expect(await getText(`#hmr-test3`)).toBe('foo');

						// add div 2
						expect(await getEl('#hmr-test4')).toBe(null);
						await updateCounter((content) =>
							content.replace(
								'<!-- HMR-TEMPLATE-INJECT -->',
								'<div id="hmr-test4">bar</div>\n<!-- HMR-TEMPLATE-INJECT -->'
							)
						);
						await expect(await getText(`#hmr-test3`)).toBe('foo');
						await expect(await getText(`#hmr-test4`)).toBe('bar');
						// remove div 1
						await updateCounter((content) =>
							content.replace('<div id="hmr-test3">foo</div>\n', '')
						);
						await expect(await getText(`#hmr-test3`)).toBe(null);
						await expect(await getText(`#hmr-test4`)).toBe('bar');
					});

					it('should apply changed styles', async () => {
						expect(await getColor(`button`)).toBe('rgb(255, 62, 0)');
						await updateCounter((content) => content.replace('color: #ff3e00', 'color: blue'));
						expect(await getColor(`button`)).toBe('blue');
						await updateCounter((content) => content.replace('color: blue', 'color: green'));
						expect(await getColor(`button`)).toBe('green');
					});

					it('should apply changed initial state', async () => {
						expect(await getText('button')).toBe('Clicks: 0');
						await updateCounter((content) => content.replace('let count = 0', 'let count = 2'));
						expect(await getText('button')).toBe('Clicks: 2');
						await updateCounter((content) => content.replace('let count = 2', 'let count = 0'));
						expect(await getText('button')).toBe('Clicks: 0');
					});
				});
				describe('config file update', () => {
					it('should auto refresh', async () => {
						const button = await getEl('button');
						await button.click();
						expect(await getText('button')).toBe('Clicks: 1');
						editFile('svelte.config.js', (config) => config + '\n');
						await waitForNavigation({ waitUntil: 'networkidle' });
						// clicks should reset, means the browser refreshed
						expect(await getText('button')).toBe('Clicks: 0');
					});
				});
			});
		}
	});
});
