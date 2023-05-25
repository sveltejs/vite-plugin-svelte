import App from './App.svelte';

import { esm } from 'e2e-test-dep-esm-only';
console.log(esm());

export async function render(url, manifest) {
	return App.render({
		name: 'world'
	});
}
