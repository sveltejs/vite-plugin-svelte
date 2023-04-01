import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import vitePluginWindicss from 'vite-plugin-windicss';

export default defineConfig({
	plugins: [
		svelte({ experimental: { generateMissingPreprocessorSourcemaps: true } }),
		vitePluginWindicss()
	]
});
