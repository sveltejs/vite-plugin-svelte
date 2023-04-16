import { describe, it, expect } from 'vitest';
import { removeLangSuffix, convertSourcePathsToRelative } from '../sourcemaps';

describe('removeLangSuffix', () => {
	it('removes suffix', () => {
		const map = {
			file: '/some/path/File.svelte.scss',
			sources: ['foo.scss', 'File.svelte.scss'],
			sourceRoot: '/some/path'
		};
		removeLangSuffix(map, '/some/path/File.svelte', 'scss');
		expect(map.file).toBe('/some/path/File.svelte');
		expect(map.sourceRoot).toBe('/some/path');
		expect(map.sources[0]).toBe('foo.scss');
		expect(map.sources[1]).toBe('File.svelte');
	});
});

describe('convertToRelativePaths', () => {
	it('converts absolute to relative', () => {
		const map = {
			file: '/some/path/File.svelte',
			sources: ['/some/path/foo.scss', '/some/path/File.svelte']
		};
		convertSourcePathsToRelative(map, '/some/path/File.svelte');
		expect(map.file).toBe('File.svelte');
		expect(map.sources[0]).toBe('foo.scss');
		expect(map.sources[1]).toBe('File.svelte');
	});

	it('accounts for sourceRoot', () => {
		const map = {
			file: '/some/path/File.svelte',
			sources: ['path/foo.scss', '/some/path/File.svelte'],
			sourceRoot: '/some'
		};
		convertSourcePathsToRelative(map, '/some/path/File.svelte');
		expect(map.file).toBe('File.svelte');
		expect(map.sources[0]).toBe('foo.scss');
		expect(map.sources[1]).toBe('File.svelte');
	});
});
