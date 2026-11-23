import App from './App.svelte';
import { esm } from 'e2e-test-dep-esm-only';
import { render as ssr } from 'svelte/server';
console.log(esm());

export async function render(url) {
	return ssr(App, { props: { name: 'world' } });
}
