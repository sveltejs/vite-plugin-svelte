import { test, Test } from './lib';
import App from './App.svelte';

main();

export function main({ arg = true }: Test = {}): void {
	if (arg && test()) {
		// only create app when test worked
		const app = new App({
			target: document.body
		});
	}
}
