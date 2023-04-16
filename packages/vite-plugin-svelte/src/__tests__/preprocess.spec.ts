import { describe, it, expect } from 'vitest';
import { vitePreprocess } from '../preprocess';
import path from 'path';
import { fileURLToPath } from 'url';
const fixturesDir = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	'fixtures',
	'preprocess'
);

describe('vitePreprocess', () => {
	it('returns function', () => {
		const preprocessorGroup = vitePreprocess({ script: true, style: true });
		expect(typeof preprocessorGroup).toBe('object');
		expect(typeof preprocessorGroup.script).toBe('function');
		expect(typeof preprocessorGroup.style).toBe('function');
	});

	describe('style', async () => {
		it('produces sourcemap with relative filename', async () => {
			const { style } = vitePreprocess({ style: { css: { devSourcemap: true } } });
			const depFixture = `${fixturesDir}/foo.scss`;
			const scss = `
			  @import '${depFixture}';
				.foo {
				  &.bar {
				  color: red;
				  }
				}`.replace(/\t/g, '');
			const file = `${path.resolve('File.svelte')}`;
			const processed = await style({
				content: scss,
				attributes: {
					lang: 'scss'
				},
				markup: '', // not read by vitePreprocess
				filename: file
			});
			expect(processed).toBeDefined();
			// @ts-ignore
			const { code, map } = processed;
			expect(code).toBe('.foo {\n  color: green;\n}\n\n.foo.bar {\n  color: red;\n}');
			expect(map.file).toBe('File.svelte');
			expect(map.sources.length).toBe(2);
			expect(map.sources[0]).toBe(path.relative(file, depFixture));
			expect(map.sources[1]).toBe('File.svelte');
		});
	});
});
