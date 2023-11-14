import { VERSION } from 'svelte/compiler';

/**
 * @type {boolean}
 */
export const isSvelte4 = VERSION.startsWith('4.');

/**
 * @type {boolean}
 */
export const isSvelte5 = VERSION.startsWith('5.');
