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

		describe('top layer', () => {
			async function toggleInspector() {
				await page.evaluate(() =>
					document.body.dispatchEvent(
						new KeyboardEvent('keydown', { key: 'x', code: 'KeyX', altKey: true, bubbles: true })
					)
				);
			}

			// true if the overlay is the topmost element at its own center point
			async function isOverlayOnTop() {
				return page.evaluate(() => {
					const overlay = document.getElementById('svelte-inspector-overlay');
					if (!overlay) return false;
					const rect = overlay.getBoundingClientRect();
					const hit = document.elementFromPoint(
						rect.left + rect.width / 2,
						rect.top + rect.height / 2
					);
					return !!hit && overlay.contains(hit);
				});
			}

			it('should show the overlay above a popover', async () => {
				await page.locator('#open-popover').click();
				await page.locator('#popover-content').waitFor({ state: 'visible' });
				await toggleInspector();
				await page.locator('#popover-content').hover();
				await page
					.locator('#svelte-inspector-overlay')
					.waitFor({ state: 'visible', timeout: isCI ? 2000 : 1000 });
				expect(await isOverlayOnTop()).toBe(true);
				await toggleInspector();
				await page.evaluate(() => document.getElementById('popover').hidePopover());
			});

			it('should show the overlay above a modal dialog', async () => {
				await page.locator('#open-dialog').click();
				await page.locator('#dialog-content').waitFor({ state: 'visible' });
				// the host has to be shown again after the dialog to be above it in the top layer.
				// elements outside of a modal dialog are not hit-testable, so observe the popover state instead
				await page.evaluate(() => {
					const host = document.getElementById('svelte-inspector-host');
					window.__host_toggles = [];
					host.addEventListener('beforetoggle', (e) => window.__host_toggles.push(e.newState));
				});
				await toggleInspector();
				await page.waitForFunction(() => window.__host_toggles.join() === 'closed,open');
				await page.locator('#dialog-content').hover();
				await page
					.locator('#svelte-inspector-overlay')
					.waitFor({ state: 'visible', timeout: isCI ? 2000 : 1000 });
				await toggleInspector();
				await page.evaluate(() => document.getElementById('dialog').close());
			});
		});
	} else {
		it('should not show inspector toggle during preview', async () => {
			expect(await getEl('#svelte-inspector-toggle')).toBe(null);
		});
	}
});
