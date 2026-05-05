import { describe, it, expect, beforeEach } from 'vitest';
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

	describe('script', () => {
		/** @type {import('svelte/types/compiler/preprocess').Preprocessor} */
		let script;

		const scriptArgs = (/** @type {string} */ content) => ({
			content,
			attributes: { lang: 'ts' },
			markup: '',
			filename: `${fixtureDir}/File.svelte`
		});

		beforeEach(() => {
			const preprocessorGroup = vitePreprocess({ script: true });
			script = /** @type {import('svelte/types/compiler/preprocess').Preprocessor} */ (
				preprocessorGroup.script
			);
		});

		it('preserves value imports unused in script but potentially used in template', async () => {
			const content = `
  import Component from './Component.svelte';
  import { helper } from './utils.js';
  interface Props { value: string; }
  let { value } = $props();
  const x = helper(value);`;

			const processed = await script(scriptArgs(content));
			expect(processed).toBeDefined();
			// helper is used in script, so it should be preserved by oxc
			expect(processed.code).toContain('helper');
			// Component is only used in template (not in script), but onlyRemoveTypeImports
			// ensures it is preserved
			expect(processed.code).toContain('import Component from "./Component.svelte"');
		});

		it('does not duplicate imports that oxc preserves', async () => {
			const content = `
  import { writable } from 'svelte/store';
  const store = writable(0);`;

			const processed = await script(scriptArgs(content));
			expect(processed).toBeDefined();
			// writable is used in script, should appear exactly once as an import
			const matches = processed.code.match(/writable/g);
			expect(matches.length).toBe(2); // one in import, one in usage
		});

		it('strips type-only imports', async () => {
			const content = `
  import type { SomeType } from './types.js';
  import Component from './Component.svelte';
  let x: SomeType;`;

			const processed = await script(scriptArgs(content));
			expect(processed).toBeDefined();
			// type import should be correctly stripped
			expect(processed.code).not.toContain('SomeType');
			// value import should be preserved
			expect(processed.code).toContain('import Component from "./Component.svelte"');
		});

		it('preserves value specifiers and strips type specifiers from mixed imports', async () => {
			const content = `
  import { Foo, type Bar } from './components.js';
  const x = 1;`;

			const processed = await script(scriptArgs(content));
			expect(processed).toBeDefined();
			// Foo is a value import - preserved even though unused in script
			expect(processed.code).toContain('Foo');
			// Bar is a type specifier - should be stripped
			expect(processed.code).not.toContain('Bar');
		});

		it('preserves value identifiers from multi-line mixed imports', async () => {
			const content = `
  import {
    parse,
    TYPE,
    type MessageFormatElement,
  } from "@formatjs/icu-messageformat-parser";
  const ast = parse("hello");`;

			const processed = await script(scriptArgs(content));
			expect(processed).toBeDefined();
			// parse is used in script, should be preserved
			expect(processed.code).toContain('parse');
			// TYPE is a value import unused in script - should be preserved
			expect(processed.code).toContain('TYPE');
			// type-only specifier should be stripped
			expect(processed.code).not.toContain('MessageFormatElement');
		});

		it('preserves import even when identifier appears in string literals', async () => {
			const content = `
  import Select from '../Select.svelte';
  import { untrack } from 'svelte';
  let { withSelect = false } = $props();
  const defaultLabels = {
    ariaLabelSelectAllRows: "Select all rows",
    ariaLabelSelectRow: "Select row",
  };
  untrack(() => {});`;

			const processed = await script(scriptArgs(content));
			expect(processed).toBeDefined();
			expect(processed.code).toContain('import Select from "../Select.svelte"');
		});

		it('skips non-ts script blocks', async () => {
			const result = await script({
				content: "import Foo from './Foo.svelte';",
				attributes: {},
				markup: '',
				filename: `${fixtureDir}/File.svelte`
			});
			expect(result).toBeUndefined();
		});
	});
});
