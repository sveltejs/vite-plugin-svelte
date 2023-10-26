import { VERSION } from 'svelte/compiler';

/**
 * @type {boolean}
 */
export const isSvelte5 = VERSION.startsWith('5.');
