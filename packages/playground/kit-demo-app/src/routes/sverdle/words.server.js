// smaller verion of the actual words list of sverdle
// only solution is bluwy
// some partially right inputs allowed too
// see https://github.com/sveltejs/kit/blob/9cfa964073fd14f6d95ae87382d85130c280c6ad/packages/create-svelte/templates/default/src/routes/sverdle/words.server.ts for original

/** The list of possible words */
export const words = ['bluwy'];

/** The list of valid guesses, of which the list of possible words is a subset */
export const allowed = new Set([...words, 'ywulb', 'bluyw', 'bluyz', 'bluxw', 'xxxxx']);
