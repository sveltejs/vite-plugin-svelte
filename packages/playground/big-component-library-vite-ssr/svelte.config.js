import { optimizeImports } from 'carbon-preprocess-svelte';
import preprocess from 'svelte-preprocess';
export default {
	preprocess: [preprocess(), process.env.DEEP_IMPORTS ? optimizeImports() : null].filter(Boolean)
};
