import { browserLogs, fetchFromPage, getText, isBuild, testDir } from '~utils';
import { createServer, ViteDevServer } from 'vite';

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
		expect(result).toMatchSnapshot();
	});

	test('Dummy.svelte?raw&svelte&type=preprocessed', async () => {
		const result = await getText('#preprocessed');
		expect(result).toMatchSnapshot();
	});

	test(`Dummy.svelte?raw&svelte&type=script`, async () => {
		const result = await getText('#script');
		expect(result).toMatchSnapshot();
	});

	test('Dummy.svelte?raw&svelte&type=script&compileOptions={"customElement":true}', async () => {
		const result = await getText('#wcScript');
		expect(result).toMatchSnapshot();
	});

	test('Dummy.svelte?raw&svelte&type=style', async () => {
		const result = await getText('#style');
		expect(result).toMatchSnapshot();
	});
});

// vitest prints a warning about obsolete snapshots during build tests, ignore it, they are used in dev tests.
// always regenerate snapshots with `pnpm test:serve import-queries -u` and check the diffs if they are correct
describe.runIf(isBuild)('snapshots not obsolete warning', async () => {
	afterAll(() => {
		console.log(
			'Ignore the obsolete snapshot warnings for ssrLoadModule snapshots from vitest during test:build, they are used in test:serve'
		);
	});
	test('suite not empty', () => {
		expect(true).toBe(true);
	});
});

describe.runIf(!isBuild)('direct', () => {
	test('Dummy.svelte?direct&svelte&type=style&sourcemap&lang.css', async () => {
		const response = await fetchFromPage(
			'src/Dummy.svelte?direct&svelte&type=style&sourcemap&lang.css',
			{
				headers: { Accept: 'text/css' }
			}
		);
		expect(response.ok).toBe(true);
		expect(response.headers.get('Content-Type')).toBe('text/css');
		const css = await response.text();
		expect(css).toMatchSnapshot();
	});
	test('Dummy.svelte?direct&svelte&type=script&sourcemap&lang.js', async () => {
		const response = await fetchFromPage(
			'src/Dummy.svelte?direct&svelte&type=script&sourcemap&lang.js',
			{
				headers: { Accept: 'application/javascript' }
			}
		);
		expect(response.ok).toBe(true);
		expect(response.headers.get('Content-Type')).toBe('application/javascript');
		const js = await response.text();
		// during dev, the import is rewritten but can vary on the v= hash. replace with stable short import
		const stableJS = js.replace(
			/\/node_modules\/\.vite\/deps\/svelte_internal\.js\?v=[0-9a-f]{8}/,
			'svelte/internal'
		);
		expect(stableJS).toMatchSnapshot();
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
	});
	afterAll(async () => {
		await vite.close();
		vite = null;
		ssrLoadDummy = null;
	});
	test('?raw', async () => {
		const result = await ssrLoadDummy('?raw');
		expect(result).toMatchSnapshot();
	});
	test('?raw&svelte&type=preprocessed', async () => {
		const result = await ssrLoadDummy('?raw&svelte&type=preprocessed');
		expect(result).toMatchSnapshot();
	});
	test('?raw&svelte&type=script', async () => {
		const result = await ssrLoadDummy('?raw&svelte&type=script');
		expect(result).toMatchSnapshot();
	});
	test('?raw&svelte&type=script&compileOptions={"customElement":true}', async () => {
		const result = await ssrLoadDummy(
			'?raw&svelte&type=script&compileOptions={"customElement":true}'
		);
		expect(result).toMatchSnapshot();
	});
	test('?raw&svelte&type=style', async () => {
		const result = await ssrLoadDummy('?raw&svelte&type=style');
		expect(result).toMatchSnapshot();
	});
});
