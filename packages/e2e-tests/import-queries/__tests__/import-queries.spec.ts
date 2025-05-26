import { browserLogs, fetchFromPage, getText, isBuild, testDir } from '~utils';
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

	test('Dummy.svelte?raw&svelte&type=preprocessed', async () => {
		const result = await getText('#preprocessed');
		await expect(result).toMatchFileSnapshot(snapshotFilename('preprocessed'));
	});

	test('Dummy.svelte?raw&svelte&type=script', async () => {
		const result = await getText('#script');
		expect(result).toContain('export default function Dummy');
	});

	test('Dummy.svelte?raw&svelte&type=script&compilerOptions={"customElement":true}', async () => {
		const result = await getText('#wcScript');
		expect(result).toContain('$.create_custom_element(Dummy,');
	});

	test('Dummy.svelte?raw&svelte&type=style', async () => {
		const result = await getText('#style');
		await expect(result).toMatchFileSnapshot(snapshotFilename('style'));
	});

	test('Dummy.svelte?raw&svelte&type=all&sourcemap', async () => {
		const result = JSON.parse(await getText('#all'));
		expect(result.ast).toBeDefined();
		expect(result.js).toBeDefined();
		expect(result.js.code).toBeDefined();
		expect(result.js.map).toBeDefined();
		expect(result.css).toBeDefined();
		expect(result.css.code).toBeDefined();
		expect(result.css.map).toBeDefined();
		expect(result.preprocessed).toBeDefined();
		expect(result.preprocessed.code).toBeDefined();
		expect(result.preprocessed.map).toBeDefined();
	});

	describe.runIf(!isBuild)('mixed exports', () => {
		test('Dummy.svelte?raw&svelte&type=preprocessed', async () => {
			const module = await fetchFromPage('src/Dummy.svelte?raw&svelte&type=preprocessed').then(
				(res) => res.text()
			);
			expect(module).toContain('export const code="<script lang=\\"ts\\">');
			expect(module).toContain('export const map={');
			expect(module).toContain('export const dependencies=[]');
			expect(module).toContain('export default code');
		});
		test('Dummy.svelte?raw&svelte&type=style', async () => {
			const module = await fetchFromPage('src/Dummy.svelte?raw&svelte&type=style').then((res) =>
				res.text()
			);
			expect(module).toContain('export const code="button.');
			expect(module).toContain('export const hasGlobal=false');
			expect(module).toContain('export const map={');
			expect(module).toContain('export default code');
		});
		test('Dummy.svelte?raw&svelte&type=script', async () => {
			const module = await fetchFromPage('src/Dummy.svelte?raw&svelte&type=script').then((res) =>
				res.text()
			);
			expect(module).toContain('export const code="import');
			expect(module).toContain('export const map={');
			expect(module).toContain('export default code');
		});
		test('Dummy.svelte?raw&svelte&type=all', async () => {
			const module = await fetchFromPage('src/Dummy.svelte?raw&svelte&type=all').then((res) =>
				res.text()
			);
			expect(module).toContain('export const ast={"html":');
			expect(module).toContain('export const css={"code":"button');
			expect(module).toContain('export const dependencies=[]');
			expect(module).toContain('export const js={"code":"import ');
			expect(module).toContain('export const lang="ts"');
			expect(module).toContain('export const metadata={"runes":false}');
			expect(module).toContain('export const normalizedFilename="/src/Dummy.svelte"');
			expect(module).toContain('export const preprocessed={"code":"<script lang=\\"ts\\">');
			expect(module).toContain('export const source="<script lang=\\"ts\\">');
			expect(module).toContain('export const ssr=false');
			expect(module).toContain('export const warnings=[]');
		});
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
		expect(css).toContain('button.');
		expect(css).toContain('/*# sourceMappingURL=data');
	});
	test('Dummy.svelte?direct&svelte&type=script&sourcemap&lang.js', async () => {
		const response = await fetchFromPage(
			'src/Dummy.svelte?direct&svelte&type=script&sourcemap&lang.js',
			{
				headers: { Accept: 'text/javascript' }
			}
		);
		expect(response.ok).toBe(true);
		expect(response.headers.get('Content-Type')).toMatch(/^(?:text|application)\/javascript$/);
		const js = await response.text();
		expect(js).toContain('export default function Dummy');
		expect(js).toContain('//# sourceMappingURL=data');
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
	test('?raw&svelte&type=preprocessed', async () => {
		const result = await ssrLoadDummy('?raw&svelte&type=preprocessed');
		await expect(result).toMatchFileSnapshot(snapshotFilename('ssr-preprocessed'));
	});
	test('?raw&svelte&type=script', async () => {
		const result = await ssrLoadDummy('?raw&svelte&type=script');
		expect(result).toContain('export default function Dummy');
	});
	test('?raw&svelte&type=script&compilerOptions={"customElement":true}', async () => {
		const result = await ssrLoadDummy(
			'?raw&svelte&type=script&compilerOptions={"customElement":true}'
		);
		expect(result).toContain('$.create_custom_element(Dummy,');
	});
	test('?raw&svelte&type=style', async () => {
		const result = await ssrLoadDummy('?raw&svelte&type=style');
		expect(result).toContain('button.');
	});
	test('?inline&svelte&type=style&lang.css', async () => {
		// Preload Dummy.svelte first so its CSS is processed in the module graph, otherwise loading
		// its css inlined url directly will return the raw svelte file rather than the style
		await ssrLoadDummy('');
		const result = await ssrLoadDummy('?inline&svelte&type=style&lang.css');
		expect(result).toContain('button.');
	});
});
