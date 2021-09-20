import App from './App.svelte';
import { Hello } from './types';

const hello: Hello = 'Hello';

const app = new App({
	target: document.body,
	props: {
		hello
	}
});

export default app;
