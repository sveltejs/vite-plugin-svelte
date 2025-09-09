import { describe, it, expect } from 'vitest';
import { gte } from '../src/utils/svelte-version.js';

describe('gte', () => {
	it('returns false for smaller tag', () => {
		expect(gte('1.2.3-next.1', '1.2.3-next.2')).toBe(false);
	});
	it('returns false for smaller patch', () => {
		expect(gte('1.2.2', '1.2.3')).toBe(false);
	});
	it('returns false for smaller minor', () => {
		expect(gte('1.1.4', '1.2.3')).toBe(false);
	});
	it('returns false for smaller major', () => {
		expect(gte('0.3.4', '1.2.3')).toBe(false);
	});
	it('returns true for equal', () => {
		expect(gte('1.2.3-next.1', '1.2.3-next.1')).toBe(true);
	});
	it('returns false for larger tag', () => {
		expect(gte('1.2.3-next.2', '1.2.3-next.1')).toBe(true);
	});
	it('returns true for larger patch', () => {
		expect(gte('1.2.4', '1.2.3')).toBe(true);
	});
	it('returns true for larger minor', () => {
		expect(gte('1.3.1', '1.2.3')).toBe(true);
	});
	it('returns true for larger major', () => {
		expect(gte('2.0.0', '1.2.3')).toBe(true);
	});
});
