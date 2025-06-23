import { e2eServer, getText } from '~utils';
import { describe, expect, it } from 'vitest';
describe('vite import scan', () => {
	it('should not fail to discover dependencies exported from script module', async () => {
		// vite logs an error if scan fails but continues, so validate no errors logged
		const errorLogs = e2eServer.logs.server.err.filter(
			(line) =>
				![
					'Support for rolldown-vite in vite-plugin-svelte is experimental',
					'See https://github.com/sveltejs/vite-plugin-svelte/issues/1143 for a list of known issues'
				].some((ignore) => line.includes(ignore))
		);
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
