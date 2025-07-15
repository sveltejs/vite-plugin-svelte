import { VERSION } from 'svelte/compiler';

/**
 * @type {boolean}
 */
export const isSvelteWithAsync = gte(VERSION, '5.36.0');

/**
 * compare semver versions, does not include comparing tags (-next.xy is ignored)
 *
 * @param {string} a semver version
 * @param {string} b semver version
 * @return {boolean} true if a is greater or equal to b
 */
export function gte(a, b) {
	const aNum = a.split(/[.-]/, 3).map(Number);
	const bNum = b.split(/[.-]/, 3).map(Number);
	for (let i = 0; i < aNum.length; i++) {
		if (aNum[i] < bNum[i]) {
			return false;
		}
		if (aNum[i] > bNum[i]) {
			return true;
		}
	}
	return true;
}
