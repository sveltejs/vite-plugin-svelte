import { describe, it, expect } from 'vitest';
import { removeLangSuffix, mapToRelative } from '../sourcemaps';
import { lang_sep } from '../../preprocess';
import { normalizePath } from 'vite';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const fixtureDir = normalizePath(
	path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'preprocess')
);
const filename = 'File.svelte';

describe('removeLangSuffix', () => {
	it('removes suffix', () => {
		const suffix = `${lang_sep}scss`;
		const map = {
			file: `${fixtureDir}/${filename}${suffix}`,
			sources: ['foo.scss', `${fixtureDir}/${filename}${suffix}`],
			sourceRoot: fixtureDir
		};
		removeLangSuffix(map, suffix);
		expect(map.file).toBe(`${fixtureDir}/${filename}`);
		expect(map.sourceRoot).toBe(fixtureDir);
		expect(map.sources[0]).toBe('foo.scss');
		expect(map.sources[1]).toBe(`${fixtureDir}/${filename}`);
	});
});

describe('mapToRelative', () => {
	it('converts absolute to relative', () => {
		const file = `${fixtureDir}/File.svelte`;
		const map = {
			file,
			sources: [`${fixtureDir}/foo.scss`, file]
		};
		mapToRelative(map, file);
		expect(map.file).toBe('File.svelte');
		expect(map.sources[0]).toBe('foo.scss');
		expect(map.sources[1]).toBe('File.svelte');
	});

	it('accounts for sourceRoot', () => {
		const file = `${fixtureDir}/File.svelte`;
		const sourceRoot = normalizePath(path.resolve(fixtureDir, '..'));
		const rootedBase = fixtureDir.replace(sourceRoot, '');
		const map = {
			file,
			sourceRoot,
			sources: [
				`${rootedBase}/foo.scss`,
				`${rootedBase}/File.svelte`,
				`${pathToFileURL(`${fixtureDir}/bar.scss`)}`
			]
		};
		mapToRelative(map, file);
		expect(map.file).toBe('File.svelte');
		expect(map.sources[0]).toBe('foo.scss');
		expect(map.sources[1]).toBe('File.svelte');
		expect(map.sources[2]).toBe('bar.scss');
		expect(map.sources.length).toBe(3);
		expect(map.sourceRoot).not.toBeDefined();
	});

	it('accounts for relative sourceRoot', () => {
		const file = `${fixtureDir}/File.svelte`;
		const map = {
			file,
			sourceRoot: './some-path/..',
			sources: [`foo.scss`, `File.svelte`, `${pathToFileURL(`${fixtureDir}/bar.scss`)}`]
		};
		mapToRelative(map, file);
		expect(map.file).toBe('File.svelte');
		expect(map.sources[0]).toBe('./some-path/../foo.scss');
		expect(map.sources[1]).toBe('./some-path/../File.svelte');
		expect(map.sources[2]).toBe('bar.scss');
		expect(map.sources.length).toBe(3);
		expect(map.sourceRoot).not.toBeDefined();
	});
});
