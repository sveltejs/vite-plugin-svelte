import App from './App.svelte';

if (App.toString().startsWith('class ')) {
	new App({ target: document.body });
} else {
	import('svelte').then(({ mount }) => mount(App, { target: document.body }));
}
