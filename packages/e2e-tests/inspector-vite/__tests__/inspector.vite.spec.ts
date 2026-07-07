import { getEl, getText, isBuild, page, isCI } from '~utils';

describe('inspector-vite', () => {
	it('should render page', async () => {
		expect(await getText('h1')).toBe('Hello Inspector!');
	});
	if (!isBuild) {
		it('should show inspector toggle during dev', async () => {
			await page
				.locator('#svelte-inspector-toggle')
				.waitFor({ state: 'visible', timeout: isCI ? 2000 : 500 });
			expect(await getEl('#svelte-inspector-toggle')).not.toBe(null);
		});

		it('should open a context menu', async () => {
			await page.evaluate(() =>
				document.body.dispatchEvent(
					new KeyboardEvent('keydown', { key: 'x', code: 'KeyX', altKey: true, bubbles: true })
				)
			);

			await page.locator('#counter').click({ button: 'right' });

			const menu = page.locator('#svelte-inspector-overlay');
			await menu.waitFor({ state: 'visible', timeout: isCI ? 2000 : 1000 });

			const text = await menu.innerText();
			expect(text).toContain('Counter.svelte');
			expect(text).toContain('App.svelte');
		});
	} else {
		it('should not show inspector toggle during preview', async () => {
			expect(await getEl('#svelte-inspector-toggle')).toBe(null);
		});
	}
});
