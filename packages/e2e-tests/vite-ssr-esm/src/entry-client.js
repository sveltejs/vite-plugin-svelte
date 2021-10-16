import App from './App.svelte';

const app = new App({
	target: document.getElementById('svelte'),
	hydrate: true,
	props: {
		world: 'svelte world'
	}
});

export default app;
