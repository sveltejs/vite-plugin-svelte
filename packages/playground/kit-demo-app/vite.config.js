// eslint-disable-next-line node/no-missing-import
import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	optimizeDeps: {
		exclude: ['codemirror', '@codemirror/lang-html', '@codemirror/theme-one-dark']
	},
	css: {
		devSourcemap: true
	}
};

export default config;
