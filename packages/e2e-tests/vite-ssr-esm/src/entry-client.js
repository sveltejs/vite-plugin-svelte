import App from './App.svelte';
import { esm } from 'e2e-test-dep-esm-only';
import { hydrate } from 'svelte';
console.log(esm());

hydrate(App, {
	target: document.getElementById('svelte'),
	props: {
		world: 'svelte world'
	}
});
