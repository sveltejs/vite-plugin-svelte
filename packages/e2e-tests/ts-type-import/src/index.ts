import type { Test } from './lib.js';
import { test } from './lib.js';
import App from './App.svelte';

main();

export function main({ arg = true }: Test = {}): void {
	if (arg && test()) {
		if (App.toString().startsWith('class ')) {
			new App({ target: document.body });
		} else {
			import('svelte').then(({ mount }) => {
				mount(App, { target: document.body });
			});
		}
	}
}
