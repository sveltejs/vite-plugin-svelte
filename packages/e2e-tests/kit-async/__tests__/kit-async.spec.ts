import { describe, expect, it } from 'vitest';
import { getText, IS_SVELTE_BASELINE, sleep } from '~utils';

describe.skipIf(IS_SVELTE_BASELINE)('kit-async', async () => {
	it('works', async () => {
		expect(await getText('h1')).toBe('Hello async world!');
		expect(await getText('span')).toBe('Wait for it ...');
		// TODO ideally this would wait for the actual async settled but that requires a new util
		await sleep(700); // the async derived resolves after 500ms
		expect(await getText('span')).toBe('foo');
	});
});
