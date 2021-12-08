import App from './App.svelte';
// eslint-disable-next-line node/no-missing-import
import { esm } from 'e2e-test-dep-esm-only';
import decamelize from 'decamelize';

console.log(esm());
console.log(decamelize('helloWorld'));

export async function render(url, manifest) {
	return App.render({
		name: 'world'
	});
}
