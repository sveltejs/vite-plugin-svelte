import adapter from '@sveltejs/adapter-auto';
import { optimizeImports } from 'carbon-preprocess-svelte';
import process from 'node:process';
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [sveltePreprocess(), process.env.DEEP_IMPORTS ? optimizeImports() : null].filter(
		Boolean
	),
	kit: {
		adapter: adapter()
	}
};

export default config;
