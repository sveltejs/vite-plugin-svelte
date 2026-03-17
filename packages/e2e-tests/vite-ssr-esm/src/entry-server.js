import App from './App.svelte';
import { esm } from 'e2e-test-dep-esm-only';
import decamelize from 'decamelize';
import { render as ssr } from 'svelte/server';
console.log(esm());
console.log(decamelize('helloWorld'));

export async function render(url) {
	return ssr(App, { props: { name: 'world' } });
}
