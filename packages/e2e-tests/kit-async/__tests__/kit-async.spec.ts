import { describe, expect, it } from 'vitest';
import { getEl, getText, IS_SVELTE_BASELINE } from '~utils';

describe.skipIf(IS_SVELTE_BASELINE)('kit-async', async () => {
	it('resolves and updates an async derived created in a svelte module', async () => {
		expect(await getText('h1')).toBe('Hello async world!');
		await expect.poll(() => getText('span')).toBe('2');

		const button = await getEl('button');
		await button.click();
		await expect.poll(() => getText('span')).toBe('4');
	});
});
