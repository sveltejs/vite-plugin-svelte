import { describe, expect, it } from 'vitest';
import { getText } from '~utils';

describe('kit-async', async () => {
	it('works', async () => {
		expect(await getText('h1')).toBe('Hello async world!');
		// the async derived resolves after 500ms
		await expect.poll(() => getText('span')).toBe('foo');
	});
});
