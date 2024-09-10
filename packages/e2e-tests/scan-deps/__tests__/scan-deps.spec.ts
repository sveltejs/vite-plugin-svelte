import { e2eServer, getText, isBuild, serverLogs } from '~utils';

test('should discover dependencies exported from script module', async () => {
	//expect(e2eServer.logs.server.out.length).toBeGreaterThan(1);
	console.log('server logs', e2eServer.logs.server.out);
	expect(await getText('p')).toBe('42');
	//expect(serverLogs.some((log) => log.includes('No matching export in'))).toBeFalsy();
});
