import App from './App.svelte';
import { esm } from 'e2e-test-dep-esm-only';
import decamelize from 'decamelize';

console.log(esm());
console.log(decamelize('helloWorld'));

const importSvelteServer = new Function("return import('svelte/server')");

export async function render(url, manifest) {
	if (App.render) {
		return App.render({
			name: 'world'
		});
	} else {
		importSvelteServer().then(({ render }) => render(App, { props: { name: 'world' } }));
	}
}
