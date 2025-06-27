import { browserLogs, getText, isBuild, testDir } from '~utils';
import { createServer, ViteDevServer } from 'vite';
import { VERSION } from 'svelte/compiler';

const svelteMajor = VERSION.split('.', 1)[0];
function snapshotFilename(name: string) {
	return `./__snapshots__/svelte-${svelteMajor}/${name}.txt`;
}

describe('raw', () => {
	test('does not have failed requests', async () => {
		browserLogs.forEach((msg) => {
			expect(msg).not.toMatch('404');
		});
	});

	test('Dummy.svelte', async () => {
		expect(await getText('#component button')).toBe('dummy clicks: 0');
	});

	test('Dummy.svelte?raw', async () => {
		const result = await getText('#raw');
		await expect(result).toMatchFileSnapshot(snapshotFilename('raw'));
	});
});

describe.runIf(!isBuild)('ssrLoadModule', () => {
	let vite: ViteDevServer;
	let ssrLoadDummy;
	beforeAll(async () => {
		vite = await createServer({
			root: testDir + '/',
			appType: 'custom',
			server: { middlewareMode: true, hmr: false }
		});
		// needed to init plugins
		await vite.pluginContainer.buildStart({});
		ssrLoadDummy = async (query) =>
			vite
				.ssrLoadModule('./src/Dummy.svelte' + query, { fixStacktrace: true })
				.then((m) => m.default?.code ?? m.default);
		return async () => {
			await vite.close();
			vite = null;
			ssrLoadDummy = null;
		};
	});

	test('?raw', async () => {
		const result = await ssrLoadDummy('?raw');
		await expect(result).toMatchFileSnapshot(snapshotFilename('ssr-raw'));
	});
});
