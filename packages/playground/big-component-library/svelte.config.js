import process from 'node:process';
import { optimizeImports } from 'carbon-preprocess-svelte';
import { sveltePreprocess } from 'svelte-preprocess';
export default {
	preprocess: [sveltePreprocess(), process.env.DEEP_IMPORTS ? optimizeImports() : null].filter(
		Boolean
	)
};
