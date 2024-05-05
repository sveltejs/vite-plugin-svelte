import App from './App.svelte';
import { Hello } from './types.js';
import { mount } from 'svelte';

const hello: Hello = 'Hello';

const options = {
	target: document.body,
	props: {
		hello
	}
};

mount(App, options);
