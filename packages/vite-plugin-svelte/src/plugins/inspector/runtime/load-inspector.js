// eslint-disable-next-line n/no-missing-import
import Inspector from 'virtual:svelte-inspector-path:Inspector.svelte';
import { mount } from 'svelte';

// devtools leave this component, what it renders and its state out of their panels
/** @type {any} */ (Inspector)[Symbol.for('svelte.devtools.ignore')] = true;

function create_inspector_host() {
	const id = 'svelte-inspector-host';
	if (document.getElementById(id) != null) {
		throw new Error('svelte-inspector-host element already exists');
	}
	const el = document.createElement('div');
	el.setAttribute('id', id);
	document.documentElement.appendChild(el);
	return el;
}
mount(Inspector, { target: create_inspector_host() });
