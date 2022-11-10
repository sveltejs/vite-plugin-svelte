import { describe, it, expect } from 'vitest';
import { compareToSvelte, atLeastSvelte, olderThanSvelte, parseVersion } from '../svelte-version';
import { VERSION } from 'svelte/compiler';
const svelteVersion = parseVersion(VERSION);
describe('svelte-version', () => {
	describe('parseVersion', () => {
		it('should fill major,minor,patch', () => {
			expect(parseVersion('3')).toEqual([3, 0, 0]);
			expect(parseVersion('3.1')).toEqual([3, 1, 0]);
		});
		it('should ignore additional segments', () => {
			expect(parseVersion('1.2.3.4')).toEqual([1, 2, 3]);
		});
	});
	describe('compareToSvelte', () => {
		it('should return 0 for current', async () => {
			expect(compareToSvelte(VERSION)).toBe(0);
		});

		it('should return 1 for patch bump', async () => {
			const patch = svelteVersion.concat();
			patch[2] += 1;
			const patchBump = patch.join('.');
			expect(compareToSvelte(patchBump)).toBe(1);
		});
		it('should return 1 for minor bump', async () => {
			const minor = svelteVersion.concat();
			minor[1] += 1;
			const minorBump = minor.join('.');
			expect(compareToSvelte(minorBump)).toBe(1);
		});
		it('should return 1 for major bump', async () => {
			const major = svelteVersion.concat();
			major[0] += 1;
			const majorBump = major.join('.');
			expect(compareToSvelte(majorBump)).toBe(1);
		});

		it('should return -1 for lower patch', async () => {
			const patch = svelteVersion.concat();
			patch[2] -= 1;
			const lowerPatch = patch.join('.');
			expect(compareToSvelte(lowerPatch)).toBe(-1);
		});
		it('should return -1 for lower minor', async () => {
			const minor = svelteVersion.concat();
			minor[1] -= 1;
			const lowerMinor = minor.join('.');
			expect(compareToSvelte(lowerMinor)).toBe(-1);
		});
		it('should return -1 for lower major', async () => {
			const major = svelteVersion.concat();
			major[0] -= 1;
			const lowerMajor = major.join('.');
			expect(compareToSvelte(lowerMajor)).toBe(-1);
		});
	});

	describe('atLeastSvelte', () => {
		it('should return true for current', async () => {
			expect(atLeastSvelte(VERSION)).toBe(true);
		});

		it('should return true for patch bump', async () => {
			const patch = svelteVersion.concat();
			patch[2] += 1;
			const patchBump = patch.join('.');
			expect(atLeastSvelte(patchBump)).toBe(true);
		});
		it('should return true for minor bump', async () => {
			const minor = svelteVersion.concat();
			minor[1] += 1;
			const minorBump = minor.join('.');
			expect(atLeastSvelte(minorBump)).toBe(true);
		});
		it('should return true for major bump', async () => {
			const major = svelteVersion.concat();
			major[0] += 1;
			const majorBump = major.join('.');
			expect(atLeastSvelte(majorBump)).toBe(true);
		});

		it('should return false for lower patch', async () => {
			const patch = svelteVersion.concat();
			patch[2] -= 1;
			const lowerPatch = patch.join('.');
			expect(atLeastSvelte(lowerPatch)).toBe(false);
		});
		it('should return false for lower minor', async () => {
			const minor = svelteVersion.concat();
			minor[1] -= 1;
			const lowerMinor = minor.join('.');
			expect(atLeastSvelte(lowerMinor)).toBe(false);
		});
		it('should return false for lower major', async () => {
			const major = svelteVersion.concat();
			major[0] -= 1;
			const lowerMajor = major.join('.');
			expect(atLeastSvelte(lowerMajor)).toBe(false);
		});
	});

	describe('olderThanSvelte', () => {
		it('should return false for current', async () => {
			expect(olderThanSvelte(VERSION)).toBe(false);
		});

		it('should return false for patch bump', async () => {
			const patch = svelteVersion.concat();
			patch[2] += 1;
			const patchBump = patch.join('.');
			expect(olderThanSvelte(patchBump)).toBe(false);
		});
		it('should return false for minor bump', async () => {
			const minor = svelteVersion.concat();
			minor[1] += 1;
			const minorBump = minor.join('.');
			expect(olderThanSvelte(minorBump)).toBe(false);
		});
		it('should return false for major bump', async () => {
			const major = svelteVersion.concat();
			major[0] += 1;
			const majorBump = major.join('.');
			expect(olderThanSvelte(majorBump)).toBe(false);
		});

		it('should return true for lower patch', async () => {
			const patch = svelteVersion.concat();
			patch[2] -= 1;
			const lowerPatch = patch.join('.');
			expect(olderThanSvelte(lowerPatch)).toBe(true);
		});
		it('should return true for lower minor', async () => {
			const minor = svelteVersion.concat();
			minor[1] -= 1;
			const lowerMinor = minor.join('.');
			expect(olderThanSvelte(lowerMinor)).toBe(true);
		});
		it('should return true for lower major', async () => {
			const major = svelteVersion.concat();
			major[0] -= 1;
			const lowerMajor = major.join('.');
			expect(olderThanSvelte(lowerMajor)).toBe(true);
		});
	});
});
