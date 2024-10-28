import { describe, it, expect } from 'vitest';
import { vitePreprocess } from '../src/preprocess.js';
import path from 'node:path';
import { normalizePath } from 'vite';
import { fileURLToPath } from 'node:url';

const fixtureDir = normalizePath(
	path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'preprocess')
);

/** @type {import('vite').InlineConfig} */
const inlineConfig = {
	configFile: false,
	root: fixtureDir
};

describe('vitePreprocess', () => {
	it('returns function', () => {
		const preprocessorGroup = vitePreprocess({ script: true, style: inlineConfig });
		expect(typeof preprocessorGroup).toBe('object');
		expect(typeof preprocessorGroup.script).toBe('function');
		expect(typeof preprocessorGroup.style).toBe('function');
	});

	describe('style', async () => {
		it('preprocess with postcss if no lang', async () => {
			const preprocessorGroup = vitePreprocess({ style: inlineConfig });
			const style = /**@type {import('svelte/types/compiler/preprocess').Preprocessor} */ (
				preprocessorGroup.style
			);
			expect(style).toBeDefined();

			const pcss = "@import './foo';";
			const processed = await style({
				content: pcss,
				attributes: {},
				markup: '', // not read by vitePreprocess
				filename: `${fixtureDir}/File.svelte`
			});

			expect(processed).toBeDefined();
			expect(processed.code).not.toContain('@import');
		});

		it('produces sourcemap with relative filename', async () => {
			const preprocessorGroup = vitePreprocess({
				style: { ...inlineConfig, css: { devSourcemap: true } }
			});
			const style = /**@type {import('svelte/types/compiler/preprocess').Preprocessor} */ (
				preprocessorGroup.style
			);
			expect(style).toBeDefined();
			const scss = `
			  @use './foo';
				.foo {
				  &.bar {
				    color: red;
				  }
				}`.replace(/\t/g, '');

			const processed = await style({
				content: scss,
				attributes: {
					lang: 'scss'
				},
				markup: '', // not read by vitePreprocess
				filename: `${fixtureDir}/File.svelte`
			});
			expect(processed).toBeDefined();
			const { code, map, dependencies } = processed;
			expect(code).toBe('.foo {\n  color: green;\n}\n\n.foo.bar {\n  color: red;\n}');
			expect(map.sources.length).toBe(2);
			expect(map.sources[0]).toBe('foo.scss');
			expect(map.sources[1]).toBe('File.svelte');
			expect(dependencies).toBeDefined();
			expect(dependencies[0]).toBe(path.resolve(fixtureDir, 'foo.scss'));
			expect(dependencies.length).toBe(1);
		});
	});
});
