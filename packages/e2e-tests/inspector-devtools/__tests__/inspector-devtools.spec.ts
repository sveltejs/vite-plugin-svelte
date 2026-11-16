import { getEl, getText, isBuild, page, isCI } from '~utils';

const timeout = isCI ? 5000 : 2000;

// `__DEVFRAME_HUB_CLIENT_CONTEXT__`: the Vite DevTools client context in the page (devframe hub)

describe('inspector-devtools', () => {
	it('should render page', async () => {
		expect(await getText('h1')).toBe('Hello Inspector!');
	});

	if (isBuild) {
		it('should not add the inspector to the build', async () => {
			expect(await getEl('#svelte-inspector-host')).toBe(null);
		});
		return;
	}

	it('should be added to the Vite DevTools dock instead of injecting a toggle button', async () => {
		await page.waitForFunction(
			() => document.getElementById('svelte-inspector-host') !== null,
			null,
			{
				timeout
			}
		);
		const ids = await page.evaluate(
			() =>
				(window as any).__DEVFRAME_HUB_CLIENT_CONTEXT__.docks.entries.map(
					(e: any) => e.id
				) as string[]
		);
		expect(ids).toContain('svelte:inspector');
		expect(ids).toContain('svelte:inspector-settings');
		expect(await getEl('#svelte-inspector-toggle')).toBe(null);
	});

	it('should keep the picker on the bar and its settings in the Svelte group', async () => {
		const { labels, settingsGroup, opened } = await page.evaluate(async () => {
			const docks = (window as any).__DEVFRAME_HUB_CLIENT_CONTEXT__.docks;
			const root = document.querySelector('devframes-dock-embedded')!.shadowRoot!;
			const labels = [...root.querySelectorAll('.devframes-dock-entry button')].map((b) =>
				b.getAttribute('aria-label')
			);
			const settingsGroup = docks.entries.find(
				(e: any) => e.id === 'svelte:inspector-settings'
			)?.groupId;
			await docks.switchEntry('svelte:inspector-settings');
			const opened = docks.selected?.id;
			await docks.switchEntry(null);
			return { labels, settingsGroup, opened };
		});
		expect(labels).toContain('Svelte Inspector');
		expect(labels).toContain('Svelte');
		expect(labels).not.toContain('Svelte Inspector settings');
		expect(settingsGroup).toBe('svelte');
		expect(opened).toBe('svelte:inspector-settings');
	});

	it('should show the hand-written settings view in its panel', async () => {
		const view = await page.evaluate(async () => {
			const docks = (window as any).__DEVFRAME_HUB_CLIENT_CONTEXT__.docks;
			await docks.switchEntry('svelte:inspector-settings');
			const panel = await new Promise<HTMLElement>((resolve) => {
				const poll = () => {
					const el = docks.getStateById('svelte:inspector-settings')?.domElements.panel;
					if (el?.querySelector('.sis')) resolve(el);
					else setTimeout(poll, 50);
				};
				poll();
			});
			const shortcut = panel.querySelector('.sis-key') as HTMLButtonElement;
			const button = (text: string) =>
				[...panel.querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;
			const resetAtDefaults = button('Reset to defaults').disabled;
			const before = shortcut.textContent?.replace(/\s+/g, '');
			// record a new shortcut: click, then press it
			shortcut.click();
			window.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', ctrlKey: true, bubbles: true })
			);
			await new Promise((r) => setTimeout(r, 50));
			const after = shortcut.textContent?.replace(/\s+/g, '');
			const save = button('Save');
			const result = {
				heading: panel.querySelector('h2')?.textContent,
				before,
				after,
				saveEnabled: !save.disabled,
				resetAtDefaults,
				resetAfterEdit: button('Reset to defaults').disabled,
				floatingButtonSection: panel.textContent?.includes('Without Vite DevTools'),
				styled: getComputedStyle(panel.querySelector('.sis')!).paddingTop
			};
			await docks.switchEntry(null);
			return result;
		});
		expect(view.heading).toBe('Svelte Inspector');
		// modifier names follow the platform: Option and Control on a Mac
		expect(view.before).toMatch(/^(⌥Option|Alt)\+X$/);
		expect(view.after).toMatch(/^(⌃Control|Ctrl)\+K$/);
		expect(view.saveEnabled).toBe(true);
		// nothing to reset until something differs from the defaults
		expect(view.resetAtDefaults).toBe(true);
		expect(view.resetAfterEdit).toBe(false);
		// the floating button only exists without Vite DevTools
		expect(view.floatingButtonSection).toBe(false);
		// its stylesheet reached the panel
		expect(view.styled).toBe('20px');
	});

	it('should turn on from the dock and keep the dock in sync with the key combo', async () => {
		await page.evaluate(() =>
			(window as any).__DEVFRAME_HUB_CLIENT_CONTEXT__.docks.setActionActive(
				'svelte:inspector',
				true
			)
		);
		await page.waitForFunction(
			() => document.body.classList.contains('svelte-inspector-enabled'),
			null,
			{
				timeout
			}
		);

		await page.evaluate(() =>
			document.body.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'x', code: 'KeyX', altKey: true, bubbles: true })
			)
		);
		await page.waitForFunction(
			() =>
				!document.body.classList.contains('svelte-inspector-enabled') &&
				!(window as any).__DEVFRAME_HUB_CLIENT_CONTEXT__.docks.getStateById('svelte:inspector')
					.isActive,
			null,
			{ timeout }
		);
	});

	it('should toggle from its Vite DevTools command shortcut', async () => {
		const enabled = (on: boolean) =>
			page.waitForFunction(
				(on) => document.body.classList.contains('svelte-inspector-enabled') === on,
				on,
				{ timeout }
			);
		await page.keyboard.press('ControlOrMeta+Shift+X');
		await enabled(true);
		await page.keyboard.press('ControlOrMeta+Shift+X');
		await enabled(false);
	});

	it('should open the picked element through Vite DevTools', async () => {
		await page.evaluate(() => {
			const w = window as any;
			w.__picks = [];
			w.__calls = [];
			window.addEventListener('svelte-inspector:pick', (e: any) => w.__picks.push(e.detail));
			const rpc = w.__DEVFRAME_HUB_CLIENT_CONTEXT__.rpc;
			const call = rpc.call.bind(rpc);
			rpc.call = (name: string, ...args: unknown[]) => {
				w.__calls.push([name, ...args]);
				return call(name, ...args);
			};
			return w.__DEVFRAME_HUB_CLIENT_CONTEXT__.docks.setActionActive('svelte:inspector', true);
		});
		await page.waitForFunction(
			() => document.body.classList.contains('svelte-inspector-enabled'),
			null,
			{
				timeout
			}
		);

		await page.locator('#counter').click();

		const { picks, calls } = await page.evaluate(() => ({
			picks: (window as any).__picks,
			calls: (window as any).__calls
		}));
		expect(picks).toHaveLength(1);
		expect(picks[0].loc.file).toMatch(/Counter\.svelte$/);
		expect(picks[0].stack.map((s: any) => s.file)).toEqual([
			expect.stringMatching(/Counter\.svelte$/),
			expect.stringMatching(/App\.svelte$/)
		]);
		const open = calls.find((c: any[]) => c[0] === 'vite:core:open-in-editor');
		// absolute path, line and column
		expect(open?.[1]).toMatch(/^\/.*\/src\/lib\/Counter\.svelte:\d+:\d+$/);
	});
});
