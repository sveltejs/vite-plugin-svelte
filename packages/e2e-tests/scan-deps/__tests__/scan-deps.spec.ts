import { getServerErrors, getText } from '~utils';
import { describe, expect, it } from 'vitest';
describe('vite import scan', () => {
	it('should not fail to discover dependencies exported from script module', async () => {
		// vite logs an error if scan fails but continues, so validate no errors logged
		const errorLogs = getServerErrors();
		expect(errorLogs.length, `unexpected errors:\n${errorLogs.join('\n')}`).toBe(0);
	});
	it('should work with exports from module context', async () => {
		expect(await getText('#svelte5')).toBe('svelte5');
		expect(await getText('#svelte4double')).toBe('svelte4double');
		expect(await getText('#svelte4single')).toBe('svelte4single');
		expect(await getText('#svelte4none')).toBe('svelte4none');
		expect(await getText('#svelte4space')).toBe('svelte4space');
	});
});
