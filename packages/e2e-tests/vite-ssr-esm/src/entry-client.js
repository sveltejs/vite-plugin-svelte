import App from './App.svelte';
import { esm } from 'e2e-test-dep-esm-only';
import { mount } from 'svelte';
console.log(esm());

mount(App, {
	target: document.getElementById('svelte'),
	props: {
		world: 'svelte world'
	}
});
