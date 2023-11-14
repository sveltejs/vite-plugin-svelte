import App from './App.svelte';

import { Hello } from './types.js';

const hello: Hello = 'Hello';

const options = {
	target: document.body,
	props: {
		hello
	}
};
if (App.toString().startsWith('class ')) {
	new App(options);
} else {
	import('svelte').then(({ mount }) => mount(App, options));
}
