import { describe, it, expect } from 'vitest';
import { merge } from '../src/utils/merge.js';

describe('merge', () => {
	it('merges nested objects, later sources win', () => {
		expect(
			merge({ a: { b: 1, c: 2 }, x: 1 }, { a: { c: 3, d: 4 }, y: 2 }, { a: { d: 5 }, x: 3 })
		).toEqual({
			a: { b: 1, c: 3, d: 5 },
			x: 3,
			y: 2
		});
	});

	it('skips missing sources', () => {
		expect(merge(undefined, { a: 1 }, null, { b: 2 })).toEqual({ a: 1, b: 2 });
		expect(merge()).toEqual({});
	});

	it('replaces arrays instead of concatenating them', () => {
		const preprocess = [{ name: 'b' }];
		const result = merge({ preprocess: [{ name: 'a' }], extensions: ['.svelte'] }, { preprocess });
		expect(result).toEqual({ preprocess: [{ name: 'b' }], extensions: ['.svelte'] });
		expect(result.preprocess).toBe(preprocess);
	});

	it('replaces values of a different type', () => {
		expect(merge({ a: [1], b: { c: 1 }, d: true }, { a: { e: 1 }, b: [2], d: { f: 1 } })).toEqual({
			a: { e: 1 },
			b: [2],
			d: { f: 1 }
		});
	});

	it('lets undefined and null override', () => {
		expect(merge({ a: 1, b: { c: 1 } }, { a: undefined, b: null })).toEqual({
			a: undefined,
			b: null
		});
	});

	it('keeps everything that is not a plain object by reference', () => {
		class Preprocessor {
			markup() {}
		}
		const values = {
			onwarn: () => {},
			include: /\.svelte$/,
			preprocess: new Preprocessor(),
			extensions: ['.svelte']
		};
		const result = merge({ preprocess: { name: 'a' }, extensions: ['.html'] }, values);
		for (const [key, value] of Object.entries(values)) {
			expect(result[key]).toBe(value);
		}
	});

	it('returns objects that can be mutated without changing a source', () => {
		const defaults = { compilerOptions: { css: 'external' } };
		const config = {
			compilerOptions: { dev: true, experimental: { async: true } },
			experimental: {}
		};
		const result = merge(defaults, config);
		result.compilerOptions.dev = false;
		result.compilerOptions.experimental.async = false;
		delete result.compilerOptions.css;
		result.experimental.inspector = true;
		expect(defaults).toEqual({ compilerOptions: { css: 'external' } });
		expect(config).toEqual({
			compilerOptions: { dev: true, experimental: { async: true } },
			experimental: {}
		});
	});

	it('treats an own __proto__ key as an ordinary key', () => {
		const result = merge({ a: 1 }, JSON.parse('{"__proto__":{"polluted":true},"a":2}'));
		expect(result.a).toBe(2);
		expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
		expect(/** @type {any} */ ({}).polluted).toBeUndefined();
	});
});
