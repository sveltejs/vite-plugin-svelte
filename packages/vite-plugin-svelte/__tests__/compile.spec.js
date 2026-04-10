import process from 'node:process';
import { describe, it, expect } from 'vitest';
import { createCompileSvelte } from '../src/utils/compile.js';
/** @type {import('../../types/options.d.ts').ResolvedOptions} */
const options = {
	compilerOptions: {
		dev: false,
		format: 'esm',
		css: 'external'
	},
	isBuild: false,
	isDebug: false,
	isProduction: false,
	isServe: false,
	root: process.cwd()
};

describe('createCompileSvelte', () => {
	it('returns function', () => {
		const compileSvelte = createCompileSvelte(options);
		expect(typeof compileSvelte).toBe('function');
	});

	describe('compileSvelte', async () => {
		it('removes dangling pure annotations', async () => {
			const code = `<script>
				const x=1;
				console.log('something',/* @__PURE__ */ new Date());
        console.log('something else');
        </script>
				<div>{x}</div>`;
			const compileSvelte = createCompileSvelte(options);
			const output = await compileSvelte(
				{
					cssId: 'svelte-xxxxx',
					query: {},
					raw: false,
					ssr: false,
					timestamp: Date.now(),
					id: 'id',
					filename: '/some/File.svelte',
					normalizedFilename: 'some/File.svelte'
				},
				code,
				{}
			);
			expect(output.compiled.js.code).not.toContain('/* @__PURE__ */\n');
		});

		it('passes environment name to dynamicCompileOptions', async () => {
			const code = '<script>const x = 1;</script><div>{x}</div>';
			let receivedEnvironment;
			const compileSvelte = createCompileSvelte(options);
			await compileSvelte(
				{
					cssId: 'svelte-xxxxx',
					query: {},
					raw: false,
					ssr: false,
					timestamp: Date.now(),
					id: 'id',
					filename: '/some/File.svelte',
					normalizedFilename: 'some/File.svelte'
				},
				code,
				{
					dynamicCompileOptions({ environment }) {
						receivedEnvironment = environment;
					}
				},
				undefined,
				'terminal'
			);
			expect(receivedEnvironment).toBe('terminal');
		});

		it('allows dynamicCompileOptions to override generate per environment', async () => {
			const code = '<script>const x = 1;</script><div>{x}</div>';
			const compileSvelte = createCompileSvelte(options);
			const output = await compileSvelte(
				{
					cssId: 'svelte-xxxxx',
					query: {},
					raw: false,
					ssr: true,
					timestamp: Date.now(),
					id: 'id',
					filename: '/some/File.svelte',
					normalizedFilename: 'some/File.svelte'
				},
				code,
				{
					dynamicCompileOptions({ environment }) {
						if (environment === 'terminal') {
							return { generate: 'client' };
						}
					}
				},
				undefined,
				'terminal'
			);
			// Even though ssr: true would normally produce generate: 'server',
			// dynamicCompileOptions overrides it to 'client' for the terminal environment
			expect(output.compiled.js.code).not.toContain('$$renderer.push');
		});

		it('detects script lang', async () => {
			const code = `<!-- this file uses typescript -->
			<!--
			<script lang="foo">
			</script>-->
			<script lang="ts" generics="T">
				const x = 1;
				console.log('something',/* @__PURE__ */ new Date());
				console.log('something else');
			</script>
			<div>{x}</div>`;

			const compileSvelte = createCompileSvelte(options);
			const output = await compileSvelte(
				{
					cssId: 'svelte-xxxxx',
					query: {},
					raw: false,
					ssr: false,
					timestamp: Date.now(),
					id: 'id',
					filename: '/some/File.svelte',
					normalizedFilename: 'some/File.svelte'
				},
				code,
				{}
			);

			expect(output.lang).toBe('ts');
		});
	});
});
