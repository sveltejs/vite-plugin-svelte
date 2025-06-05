import { describe, it, expect } from 'vitest';
import { buildIdFilter, buildModuleIdFilter } from '../src/utils/id.js';

function passes(filter, id) {
	const included = filter.id.include.some((includeRE) => includeRE.test(id));
	return included && !filter.id.exclude.some((excludeRE) => excludeRE.test(id));
}

describe('buildIdFilter', () => {
	it('default filter matches .svelte files', () => {
		const filter = buildIdFilter({});
		expect(passes(filter, '/src/Foo.svelte')).toBe(true);
		expect(passes(filter, '/src/Foo.svelte?something')).toBe(true);
	});

	it('custom filter matches .svx files', () => {
		const filter = buildIdFilter({ extensions: ['.svelte', '.svx'] });
		expect(passes(filter, '/src/Foo.svx')).toBe(true);
		expect(passes(filter, '/src/Foo.svx?something')).toBe(true);
	});
});

describe('buildModuleIdFilter', () => {
	it('default filter matches .svelte. files', () => {
		const filter = buildModuleIdFilter({});
		expect(passes(filter, '/src/foo.svelte.js')).toBe(true);
		expect(passes(filter, '/src/foo.svelte.ts')).toBe(true);
		expect(passes(filter, '/src/foo.svelte.test.js')).toBe(true);
		expect(passes(filter, '/src/foo.svelte.test.ts')).toBe(true);
	});

	it('custom filter matches .svx. files', () => {
		const filter = buildModuleIdFilter({ experimental: { compileModule: { infixes: ['.svx.'] } } });
		expect(passes(filter, '/src/foo.svx.js')).toBe(true);
		expect(passes(filter, '/src/foo.svx.ts')).toBe(true);
		expect(passes(filter, '/src/foo.svx.test.js')).toBe(true);
		expect(passes(filter, '/src/foo.svx.test.ts')).toBe(true);
	});
});
