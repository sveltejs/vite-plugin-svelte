import { browserLogs, fetchFromPage, getText, isBuild, testDir } from '~utils';
import { createServer, ViteDevServer } from 'vite';

function normalizeJSSnapshot(result: string) {
	// during dev, the import is rewritten but can vary on the v= hash. replace with stable short import
	return result
		.replace(/\.js\?v=[0-9a-f]{8}/g, '.js?v=XXX')
		.replace(/generated by Svelte v\d\.\d+\.\d+[^ ]* \*\//g, 'generated by Svelte vXXX');
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
		expect(result).toMatchSnapshot();
	});

	test('Dummy.svelte?raw&svelte&type=preprocessed', async () => {
		const result = await getText('#preprocessed');
		expect(result).toMatchSnapshot();
	});

	test(`Dummy.svelte?raw&svelte&type=script`, async () => {
		const result = await getText('#script');
		expect(normalizeJSSnapshot(result)).toMatchSnapshot();
	});

	test('Dummy.svelte?raw&svelte&type=script&compilerOptions={"customElement":true}', async () => {
		const result = await getText('#wcScript');
		expect(normalizeJSSnapshot(result)).toMatchSnapshot();
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
		expect(normalizeJSSnapshot(js)).toMatchSnapshot();
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
		expect(normalizeJSSnapshot(result)).toMatchSnapshot();
	});
	test('?raw&svelte&type=script&compilerOptions={"customElement":true}', async () => {
		const result = await ssrLoadDummy(
			'?raw&svelte&type=script&compilerOptions={"customElement":true}'
		);
		expect(normalizeJSSnapshot(result)).toMatchSnapshot();
	});
	test('?raw&svelte&type=style', async () => {
		const result = await ssrLoadDummy('?raw&svelte&type=style');
		expect(result).toMatchSnapshot();
	});
});
