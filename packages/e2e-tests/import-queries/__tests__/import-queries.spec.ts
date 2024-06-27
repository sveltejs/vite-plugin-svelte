import { browserLogs, fetchFromPage, getText, isBuild, testDir } from '~utils';
import { createServer, ViteDevServer } from 'vite';
import { VERSION } from 'svelte/compiler';

function normalizeSnapshot(result: string) {
	// during dev, the import is rewritten but can vary on the v= hash. replace with stable short import
	return result
		.replace(/\(Svelte v\d+.\d+.\d+-next\.\d+\)/, '(Svelte vXXX)') // stable svelte5 compiler comment
		.replace('// Note: compiler output will change before 5.0 is released!', '') // strip svelte5 compiler hint
		.replace(/\.js\?v=[0-9a-f]{8}/g, '.js?v=XXX') // vite import analysis import rewrite version query
		.replace(/"total": *\d+\.\d+/g, '"total":0.123456789'); // svelte compile stats
}

const svelteMajor = VERSION.split('.', 1)[0];
function snapshotFilename(name: string) {
	return `./__snapshots__/svelte-${svelteMajor}/${name}.txt`;
}

// TODO remove .skip in this file once svelte5 output is considered stable
describe.skip('raw', () => {
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
		expect(result).toMatchFileSnapshot(snapshotFilename('raw'));
	});

	test('Dummy.svelte?raw&svelte&type=preprocessed', async () => {
		const result = await getText('#preprocessed');
		expect(result).toMatchFileSnapshot(snapshotFilename('preprocessed'));
	});

	test('Dummy.svelte?raw&svelte&type=script', async () => {
		const result = await getText('#script');
		expect(normalizeSnapshot(result)).toMatchFileSnapshot(snapshotFilename('script'));
	});

	test('Dummy.svelte?raw&svelte&type=script&compilerOptions={"customElement":true}', async () => {
		const result = await getText('#wcScript');

		expect(normalizeSnapshot(result)).toMatchFileSnapshot(snapshotFilename('custom-element'));
	});

	test('Dummy.svelte?raw&svelte&type=style', async () => {
		const result = await getText('#style');
		expect(result).toMatchFileSnapshot(snapshotFilename('style'));
	});

	test('Dummy.svelte?raw&svelte&type=all&sourcemap', async () => {
		const result = await getText('#all');
		expect(normalizeSnapshot(result)).toMatchFileSnapshot(snapshotFilename('all'));
	});

	describe.runIf(!isBuild)('mixed exports', () => {
		test('Dummy.svelte?raw&svelte&type=preprocessed', async () => {
			const module = await fetchFromPage('src/Dummy.svelte?raw&svelte&type=preprocessed').then(
				(res) => res.text()
			);
			expect(normalizeSnapshot(module)).toMatchFileSnapshot(snapshotFilename('mixed-preprocessed'));
		});
		test('Dummy.svelte?raw&svelte&type=style', async () => {
			const module = await fetchFromPage('src/Dummy.svelte?raw&svelte&type=style').then((res) =>
				res.text()
			);
			expect(normalizeSnapshot(module)).toMatchFileSnapshot(snapshotFilename('mixed-style'));
		});
		test('Dummy.svelte?raw&svelte&type=script', async () => {
			const module = await fetchFromPage('src/Dummy.svelte?raw&svelte&type=script').then((res) =>
				res.text()
			);
			expect(normalizeSnapshot(module)).toMatchFileSnapshot(snapshotFilename('mixed-script'));
		});
		test('Dummy.svelte?raw&svelte&type=all', async () => {
			const module = await fetchFromPage('src/Dummy.svelte?raw&svelte&type=all').then((res) =>
				res.text()
			);
			expect(normalizeSnapshot(module)).toMatchFileSnapshot(snapshotFilename('mixed-all'));
		});
	});
});

// vitest prints a warning about obsolete snapshots during build tests, ignore it, they are used in dev tests.
// always regenerate snapshots with `pnpm test:serve import-queries -u` and check the diffs if they are correct
describe.skip.runIf(isBuild)('snapshots not obsolete warning', async () => {
	afterAll(() => {
		console.log(
			'Ignore the obsolete snapshot warnings for ssrLoadModule snapshots from vitest during test:build, they are used in test:serve'
		);
	});
	test('suite not empty', () => {
		expect(true).toBe(true);
	});
});

describe.skip.runIf(!isBuild)('direct', () => {
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
		expect(css).toMatchFileSnapshot(snapshotFilename('direct-css'));
	});
	test('Dummy.svelte?direct&svelte&type=script&sourcemap&lang.js', async () => {
		const response = await fetchFromPage(
			'src/Dummy.svelte?direct&svelte&type=script&sourcemap&lang.js',
			{
				headers: { Accept: 'text/javascript' }
			}
		);
		expect(response.ok).toBe(true);
		// vite switched from application/javascript to text/javascript in 5.1
		expect(response.headers.get('Content-Type')).toMatch(/^(?:text|application)\/javascript$/);
		const js = await response.text();
		expect(normalizeSnapshot(js)).toMatchFileSnapshot(snapshotFilename('direct-js'));
	});
});

describe.skip.runIf(!isBuild)('ssrLoadModule', () => {
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
		expect(result).toMatchFileSnapshot(snapshotFilename('ssr-raw'));
	});
	test('?raw&svelte&type=preprocessed', async () => {
		const result = await ssrLoadDummy('?raw&svelte&type=preprocessed');
		expect(result).toMatchFileSnapshot(snapshotFilename('ssr-preprocessed'));
	});
	test('?raw&svelte&type=script', async () => {
		const result = await ssrLoadDummy('?raw&svelte&type=script');
		expect(normalizeSnapshot(result)).toMatchFileSnapshot(snapshotFilename('ssr-script'));
	});
	test('?raw&svelte&type=script&compilerOptions={"customElement":true}', async () => {
		const result = await ssrLoadDummy(
			'?raw&svelte&type=script&compilerOptions={"customElement":true}'
		);
		expect(normalizeSnapshot(result)).toMatchFileSnapshot(snapshotFilename('ssr-custom-element'));
	});
	test('?raw&svelte&type=style', async () => {
		const result = await ssrLoadDummy('?raw&svelte&type=style');
		expect(result).toMatchFileSnapshot(snapshotFilename('ssr-style'));
	});
});
