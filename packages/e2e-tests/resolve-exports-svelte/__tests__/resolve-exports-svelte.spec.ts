import { browserLogs, page } from '~utils';

test('should not have failed requests', async () => {
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
});

test('should load dependency with exports svelte condition', async () => {
	for (const parent of ['#index-import', '#deep-import']) {
		expect(await page.textContent(`${parent} #dependency-import`)).toBe('dependency-import');
		expect(await page.textContent(`${parent} #sticky-dep`)).toBe('sticky-dep');
		expect(await page.textContent(`${parent} #cjs-only-dependency`)).toBe('cjs');
	}
});
