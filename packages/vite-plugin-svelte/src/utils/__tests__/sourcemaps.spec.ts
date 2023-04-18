import { describe, it, expect } from 'vitest';
import { removeLangSuffix, mapToRelative } from '../sourcemaps';
import { lang_sep } from '../../preprocess';

describe('removeLangSuffix', () => {
	it('removes suffix', () => {
		const suffix = `${lang_sep}scss`;
		const map = {
			file: `/some/path/File.svelte${suffix}`,
			sources: ['foo.scss', `File.svelte${suffix}`],
			sourceRoot: '/some/path'
		};
		removeLangSuffix(map, suffix);
		expect(map.file).toBe('/some/path/File.svelte');
		expect(map.sourceRoot).toBe('/some/path');
		expect(map.sources[0]).toBe('foo.scss');
		expect(map.sources[1]).toBe('File.svelte');
	});
});

describe('mapToRelative', () => {
	it('converts absolute to relative', () => {
		const map = {
			file: '/some/path/File.svelte',
			sources: ['/some/path/foo.scss', '/some/path/File.svelte']
		};
		mapToRelative(map, '/some/path/File.svelte');
		expect(map.file).toBe('File.svelte');
		expect(map.sources[0]).toBe('foo.scss');
		expect(map.sources[1]).toBe('File.svelte');
	});

	it('accounts for sourceRoot', () => {
		const map = {
			file: '/some/path/File.svelte',
			sources: ['path/foo.scss', 'path/File.svelte', 'file:///some/path/bar.scss'],
			sourceRoot: '/some'
		};
		mapToRelative(map, '/some/path/File.svelte');
		expect(map.file).toBe('File.svelte');
		expect(map.sources[0]).toBe('foo.scss');
		expect(map.sources[1]).toBe('File.svelte');
		expect(map.sources[2]).toBe('bar.scss');
		expect(map.sources.length).toBe(3);
		expect(map.sourceRoot).not.toBeDefined();
	});
});
