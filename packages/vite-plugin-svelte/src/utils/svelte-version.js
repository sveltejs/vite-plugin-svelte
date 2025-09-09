import { VERSION } from 'svelte/compiler';

/**
 * @type {boolean}
 */
export const isSvelteWithAsync = gte(VERSION, '5.36.0');

/**
 * split semver string and convert to number, ignores non digits in tag
 * @param {string} semver
 * @return {number[]} [major,minor,patch,tag]
 */
function splitToNumbers(semver) {
	const num = semver
		.replace(/[^\d.-]/g, '')
		.split(/[.-]+/, 4)
		.map(Number);
	while (num.length < 3) {
		num.push(0);
	}
	if (num.length < 4) {
		num.push(Infinity);
	}
	return num;
}

/**
 * compare semver versions, tags are compared by their numeric part only
 *
 * @param {string} a semver version
 * @param {string} b semver version
 * @return {boolean} true if a is greater or equal to b
 */
export function gte(a, b) {
	const aNum = splitToNumbers(a);
	const bNum = splitToNumbers(b);
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
