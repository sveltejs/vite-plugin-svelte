import App from './App.svelte';
// eslint-disable-next-line node/no-missing-import
import { esm } from 'e2e-test-dep-esm-only';
console.log(esm());

export async function render(url, manifest) {
	return App.render({
		name: 'world'
	});
}
