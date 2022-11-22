import adapter from '@sveltejs/adapter-auto';
import { optimizeImports } from 'carbon-preprocess-svelte';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [preprocess(), process.env.DEEP_IMPORTS ? optimizeImports() : null].filter(Boolean),
	kit: {
		adapter: adapter()
	}
};

export default config;
