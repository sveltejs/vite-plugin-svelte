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

		it('should open the wrapper-chain dropdown for the clicked node', async () => {
			// enter chain mode (alt-c). A synthetic keydown is dispatched because
			// headless modifier+letter key synthesis is unreliable; it still runs
			// through the real key handler.
			await page.evaluate(() =>
				document.body.dispatchEvent(
					new KeyboardEvent('keydown', { key: 'c', code: 'KeyC', altKey: true, bubbles: true })
				)
			);
			// click the <button> rendered by <Counter /> to open its wrapper chain
			await page.locator('button', { hasText: 'Clicks' }).click();
			const menu = page.locator('#svelte-inspector-menu');
			await menu.waitFor({ state: 'visible', timeout: isCI ? 2000 : 1000 });
			// the chain reaches the <Counter> call site in App.svelte, not just the
			// button's own file — which the element location alone cannot provide
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
