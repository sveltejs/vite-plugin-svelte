import App from './App.svelte';
import { esm } from 'e2e-test-dep-esm-only';

console.log(esm());

if (App.toString().startsWith('class ')) {
	new App({
		target: document.getElementById('svelte'),
		hydrate: true,
		props: {
			world: 'svelte world'
		}
	});
} else {
	import('svelte').then(({ mount }) =>
		mount(App, {
			target: document.getElementById('svelte'),
			props: {
				world: 'svelte world'
			}
		})
	);
}
