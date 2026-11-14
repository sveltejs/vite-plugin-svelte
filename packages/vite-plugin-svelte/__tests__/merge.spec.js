import { describe, it, expect } from 'vitest';
import { mergeConfigs } from '../src/utils/merge.js';

describe('mergeConfigs', () => {
	it('merges nested options in order without mutating the inputs', () => {
		const first = { compilerOptions: { dev: true, customElement: { tag: 'x-first' } } };
		const second = { compilerOptions: { customElement: { shadow: 'none' } } };
		const result = mergeConfigs(undefined, first, second);
		expect(result).toEqual({
			compilerOptions: { dev: true, customElement: { tag: 'x-first', shadow: 'none' } }
		});
		expect(result.compilerOptions).not.toBe(first.compilerOptions);
		expect(first.compilerOptions.customElement).toEqual({ tag: 'x-first' });
		expect(second.compilerOptions.customElement).toEqual({ shadow: 'none' });
	});

	it('replaces arrays by reference and preserves target-only arrays and callbacks', () => {
		const first = [{ markup: () => ({ code: '' }) }];
		const second = [{ script: () => ({ code: '' }) }];
		const onwarn = () => {};
		expect(mergeConfigs({ preprocess: first }, {}).preprocess).toBe(first);
		const result = mergeConfigs({ preprocess: first }, { preprocess: second, onwarn });
		expect(result.preprocess).toBe(second);
		expect(result.onwarn).toBe(onwarn);
	});

	it('merges and clones enumerable symbol metadata', () => {
		const symbol = Symbol('metadata');
		const first = { compilerOptions: { [symbol]: { keep: true } } };
		const second = { compilerOptions: { [symbol]: { add: true } } };
		const result = mergeConfigs(first, second);
		expect(result.compilerOptions[symbol]).toEqual({ keep: true, add: true });
		expect(result.compilerOptions[symbol]).not.toBe(second.compilerOptions[symbol]);
	});

	it.each([null, undefined, 0, false, ''])(
		'keeps prototypes intact after placeholder %s',
		(value) => {
			const source = JSON.parse('{"nested":{"__proto__":{"injected":true},"safe":1}}');
			const result = mergeConfigs({ nested: value }, source);
			expect(Object.getPrototypeOf(result.nested)).toBe(Object.prototype);
			expect(result.nested.injected).toBeUndefined();
			expect(result.nested.safe).toBe(1);
			expect({}.injected).toBeUndefined();
		}
	);

	it('omits Fastify reserved keys from both inputs', () => {
		const source = JSON.parse('{"__proto__":{},"constructor":{},"prototype":{},"safe":1}');
		expect(mergeConfigs({ nested: source }, { nested: source })).toEqual({ nested: { safe: 1 } });
	});
});
