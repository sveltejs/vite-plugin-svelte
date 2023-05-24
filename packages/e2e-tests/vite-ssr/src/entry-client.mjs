import App from './App.svelte';

import { esm } from 'e2e-test-dep-esm-only';
console.log(esm());

const app = new App({
	target: document.getElementById('svelte'),
	hydrate: true,
	props: {
		world: 'svelte world'
	}
});

export default app;
