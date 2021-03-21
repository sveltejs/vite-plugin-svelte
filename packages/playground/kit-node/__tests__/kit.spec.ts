import {
	editFileAndWaitForHmrComplete,
	getColor,
	getEl,
	getText,
	isBuild,
	untilUpdated
} from '../../testUtils';

import fetch from 'node-fetch';

test('/', async () => {
	expect(await page.textContent('h1')).toMatch('Hello world!'); // after hydration

	const html = await (await fetch(page.url())).text();
	expect(html).toMatch('Hello world!'); // before hydration
	if (isBuild) {
		// TODO expect preload links
	}
});

test('style', async () => {
	if (isBuild) {
		expect(await getColor('h1')).toBe('rgb(255, 62, 0)');
	} else {
		// During dev, the CSS is loaded from async chunk and we may have to wait
		// when the test runs concurrently.
		await untilUpdated(() => getColor('h1'), 'rgb(255, 62, 0)');
	}
});

test('404', async () => {
	// should have no 404s
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
});

if (!isBuild) {
	describe('hmr', () => {
		const updateIndexSvelte = editFileAndWaitForHmrComplete.bind(null, 'src/routes/index.svelte');
		test('should render additional html', async () => {
			expect(await getEl('#hmr-test')).toBe(null);
			await updateIndexSvelte((content) =>
				content.replace(
					'<!-- HMR-TEMPLATE-INJECT -->',
					'<div id="hmr-test">foo</div>\n<!-- HMR-TEMPLATE-INJECT -->'
				)
			);
			await expect(await getText(`#hmr-test`)).toBe('foo');
		});
		test('should apply style update', async () => {
			expect(await getColor(`h1`)).toBe('rgb(255, 62, 0)');
			await updateIndexSvelte((content) => content.replace('color: #ff3e00', 'color: red'));
			expect(await getColor(`h1`)).toBe('red');
		});
		/*
		test('should not preserve state of updated props', async () => {
			await expect(await getText(`#foo`)).toBe('foo');
			await updateIndexSvelte((content) => content.replace("foo = 'foo'", "foo = 'bar'"));
			await expect(await getText(`#foo`)).toBe('bar');
		});

		 */
	});
}
