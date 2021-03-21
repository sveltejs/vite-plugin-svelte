import {
	editFileAndWaitForHmrComplete,
	getColor,
	getEl,
	getText,
	isBuild,
	untilUpdated
} from '../../testUtils';

import fetch from 'node-fetch';

describe('kit-node', () => {
	describe('index route', () => {
		it('should contain greeting', async () => {
			expect(await page.textContent('h1')).toMatch('Hello world!'); // after hydration

			const html = await (await fetch(page.url())).text();
			expect(html).toMatch('Hello world!'); // before hydration
			if (isBuild) {
				// TODO expect preload links
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

		it('should not have failed requests', async () => {
			// should have no 404s
			browserLogs.forEach((msg) => {
				expect(msg).not.toMatch('404');
			});
		});

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

				it('should apply changed styles', async () => {
					expect(await getColor(`h1`)).toBe('rgb(255, 62, 0)');
					await updateIndexSvelte((content) => content.replace('color: #ff3e00', 'color: blue'));
					expect(await getColor(`h1`)).toBe('blue');
					await updateIndexSvelte((content) => content.replace('color: blue', 'color: green'));
					expect(await getColor(`h1`)).toBe('green');
				});

				// TODO test changing state
			});
		}
	});
});
