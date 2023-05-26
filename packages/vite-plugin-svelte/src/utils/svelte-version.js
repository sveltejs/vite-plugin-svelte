import { VERSION } from 'svelte/compiler';

/**
 * @type {boolean}
 */
export const isSvelte3 = VERSION.startsWith('3.');
