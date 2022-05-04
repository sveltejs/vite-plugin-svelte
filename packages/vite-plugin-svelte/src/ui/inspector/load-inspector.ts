// @ts-expect-error virtual import is resolved by vite-plugin-svelte-inspector
// eslint-disable-next-line node/no-missing-import
import Inspector from 'virtual:svelte-inspector:Inspector.svelte';

function create_inspector_host() {
	const id = 'svelte-inspector-host';
	if (document.getElementById(id) != null) {
		throw new Error('svelte-inspector-host element already exists');
	}
	const el = document.createElement('div');
	el.setAttribute('id', id);
	document.getElementsByTagName('body')[0].appendChild(el);
	return el;
}

new Inspector({ target: create_inspector_host() });
