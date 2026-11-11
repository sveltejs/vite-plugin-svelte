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

	test('?inline&svelte&type=style&lang.css before the component', async () => {
		const result = await ssrLoadDummy('?inline&svelte&type=style&lang.css');
		expect(result).toContain('button.svelte-');
		expect(result).not.toContain('<script');
	});
});

describe.runIf(!isBuild)('client css request before the component', () => {
	let vite: ViteDevServer;
	beforeAll(async () => {
		vite = await createServer({
			root: testDir + '/',
			appType: 'custom',
			server: { middlewareMode: true, hmr: false }
		});
		// needed to init plugins
		await vite.pluginContainer.buildStart({});
		return async () => {
			await vite.close();
			vite = null;
		};
	});

	test('?direct&svelte&type=style&lang.css', async () => {
		const client = vite.environments.client;
		const result = await client.transformRequest(
			'/src/Dummy.svelte?direct&svelte&type=style&lang.css'
		);
		expect(result.code).toContain('button.svelte-');
		expect(result.code).not.toContain('<script');
		// the component is compiled with the same url it gets when it is imported regularly
		const component = await client.moduleGraph.getModuleByUrl('/src/Dummy.svelte');
		expect(component?.url).toBe('/src/Dummy.svelte');
		expect(component?.transformResult?.code).toContain('export default function Dummy');
	});
});
