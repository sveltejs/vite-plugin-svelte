import { e2eServer } from '~utils';

test('should not fail to discover dependencies exported from script module', async () => {
	expect(
		e2eServer.logs.server.err.some((logs) =>
			logs.match(/No matching export in "html:.+\/src\/Deps\.svelte" for import "something"/)
		)
	).toBe(false);
});
