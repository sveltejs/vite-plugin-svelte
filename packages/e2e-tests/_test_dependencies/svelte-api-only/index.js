import { setContext } from 'svelte';

export function setSomeContext() {
	setContext('svelte-api-only', true);
}
