console.log('custom svelte config loaded ts');
import type { SvelteConfig } from '@sveltejs/vite-plugin-svelte';
const config: SvelteConfig = {
	vitePlugin: {
		emitCss: false
	}
};
export default config;
