import { type Test, test } from './lib.js';
import App from './App.svelte';
import { mount } from 'svelte';

main();

export function main({ arg = true }: Test = {}): void {
	if (arg && test()) {
		mount(App, { target: document.body });
	}
}
