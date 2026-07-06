import { describe, it, expect } from 'vitest';
import { buildIdFilter, buildModuleIdFilter } from '../src/utils/id.js';

function passes(filter, id) {
	const matcher = (f) => (typeof f === 'string' ? id.includes(f) : f.test(id));
	const included = filter.id.include.some(matcher);
	return included && !filter.id.exclude.some(matcher);
}

describe('buildIdFilter', () => {
	it('default filter matches .svelte files', () => {
		const filter = buildIdFilter({});
		expect(passes(filter, '/src/Foo.svelte')).toBe(true);
		expect(passes(filter, '/src/Foo.svelte?something')).toBe(true);
	});

	it('default filter does not match \\0 tagged .svelte files', () => {
		const filter = buildIdFilter({});
		expect(passes(filter, '\0/src/Foo.svelte')).toBe(false);
		expect(passes(filter, '\0/src/Foo.svelte?something')).toBe(false);
	});

	it('default filter does not match .js files', () => {
		const filter = buildIdFilter({});
		expect(passes(filter, '/src/foo.js')).toBe(false);
		expect(passes(filter, '/src/foo.js?something')).toBe(false);
	});

	it('custom filter matches .svx files', () => {
		const filter = buildIdFilter({ extensions: ['.svelte', '.svx'] });
		expect(passes(filter, '/src/Foo.svx')).toBe(true);
		expect(passes(filter, '/src/Foo.svx?something')).toBe(true);
	});
});

describe('buildModuleIdFilter', () => {
	it('default filter matches .svelte.*.js/ts files', () => {
		const filter = buildModuleIdFilter({});
		expect(passes(filter, '/src/foo.svelte.js')).toBe(true);
		expect(passes(filter, '/src/foo.svelte.ts')).toBe(true);
		expect(passes(filter, '/src/foo.svelte.test.js')).toBe(true);
		expect(passes(filter, '/src/foo.svelte.test.ts')).toBe(true);
	});

	it('default filter does not match \\0 tagged .svelte.*.js/ts files', () => {
		const filter = buildModuleIdFilter({});
		expect(passes(filter, '\0/src/foo.svelte.js')).toBe(false);
		expect(passes(filter, '\0/src/foo.svelte.ts')).toBe(false);
		expect(passes(filter, '\0/src/foo.svelte.test.js')).toBe(false);
		expect(passes(filter, '\0/src/foo.svelte.test.ts')).toBe(false);
	});

	it('default filter does not match files without .svelte.', () => {
		const filter = buildModuleIdFilter({});
		expect(passes(filter, '/src/foo.js')).toBe(false);
		expect(passes(filter, '/src/foo.ts')).toBe(false);
		expect(passes(filter, '/src/foo.test.js')).toBe(false);
		expect(passes(filter, '/src/foo.test.ts')).toBe(false);
	});

	it('custom filter matches .svx. files', () => {
		const filter = buildModuleIdFilter({ experimental: { compileModule: { infixes: ['.svx.'] } } });
		expect(passes(filter, '/src/foo.svx.js')).toBe(true);
		expect(passes(filter, '/src/foo.svx.ts')).toBe(true);
		expect(passes(filter, '/src/foo.svx.test.js')).toBe(true);
		expect(passes(filter, '/src/foo.svx.test.ts')).toBe(true);
	});
});
