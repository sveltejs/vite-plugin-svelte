import App from './App.svelte';
import { type Hello } from './types.ts';
import { mount } from 'svelte';

const hello: Hello = 'Hello';

const options = {
	target: document.body,
	props: {
		hello
	}
};

mount(App, options);
