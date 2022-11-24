//eslint-disable-next-line node/no-missing-import
import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['carbon-components-svelte', 'carbon-icons-svelte']
	}
};

export default config;
