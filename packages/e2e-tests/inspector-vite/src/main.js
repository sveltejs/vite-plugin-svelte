import App from './App.svelte';

if (App.toString().startsWith('class ')) {
	new App({ target: document.getElementById('app') });
} else {
	import('svelte').then(({ mount }) => mount(App, { target: document.getElementById('app') }));
}
