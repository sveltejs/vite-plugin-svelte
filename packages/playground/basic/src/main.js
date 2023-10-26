import './app.css';
import App from './App.svelte';
import { VERSION } from 'svelte/compiler';
import * as svelte from 'svelte';
const isSvelte5 = VERSION.startsWith('5.');
let app;

if (isSvelte5) {
	app = [window.unmount] = svelte.mount(App, {
		props: {},
		target: document.getElementById('app')
	});
} else {
	app = new App({
		target: document.getElementById('app')
	});
}

export default app;
