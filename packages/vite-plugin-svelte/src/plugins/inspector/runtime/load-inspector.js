// eslint-disable-next-line n/no-missing-import
import Inspector from 'virtual:svelte-inspector-path:Inspector.svelte';
import { mount } from 'svelte';
function create_inspector_host() {
	const id = 'svelte-inspector-host';
	if (document.getElementById(id) != null) {
		throw new Error('svelte-inspector-host element already exists');
	}
	const el = document.createElement('div');
	el.setAttribute('id', id);
	// render the inspector in the top layer, so it is not obscured by modal dialogs or popovers
	el.setAttribute('popover', 'manual');
	document.documentElement.appendChild(el);
	if (typeof el.showPopover === 'function') {
		el.showPopover();
	}
	return el;
}
mount(Inspector, { target: create_inspector_host() });
