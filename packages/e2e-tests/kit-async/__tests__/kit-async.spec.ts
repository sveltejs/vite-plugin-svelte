import { describe, expect, it } from 'vitest';
import { getText, IS_SVELTE_BASELINE } from '~utils';

describe.skipIf(IS_SVELTE_BASELINE)('kit-async', async () => {
	it('works', async () => {
		expect(await getText('h1')).toBe('Hello async world!');
		// the async derived resolves after 500ms
		await expect.poll(() => getText('span')).toBe('foo');
	});
});
