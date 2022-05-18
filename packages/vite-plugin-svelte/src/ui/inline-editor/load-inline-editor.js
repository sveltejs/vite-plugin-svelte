// eslint-disable-next-line node/no-missing-import
import InlineEditor from 'virtual:svelte-inline-editor-path:InlineEditor.svelte';

function create_inspector_host() {
	const id = 'svelte-inline-editor-host';
	if (document.getElementById(id) != null) {
		throw new Error('svelte-inline-editor-host element already exists');
	}
	const el = document.createElement('div');
	el.setAttribute('id', id);
	document.getElementsByTagName('body')[0].appendChild(el);
	return el;
}

new InlineEditor({ target: create_inspector_host() });
