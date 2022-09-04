<script>
	import CodeMirror from 'svelte-codemirror-editor';
	import { html } from '@codemirror/lang-html';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { afterUpdate } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	export let data;
	let code = data?.content || '';
	let internalUpdate = false;
	const dispatch = createEventDispatcher();

	function save() {
		dispatch('save', { data, code });
	}
	function update() {
		internalUpdate = true;
	}

	function close() {
		dispatch('close');
	}

	afterUpdate(() => {
		if (internalUpdate) {
			internalUpdate = false;
			return;
		}
		if (code !== data?.content) {
			code = data?.content ?? '';
		}
	});

	function editorKeyDown(e) {
		if (e.key === 's' && e.ctrlKey) {
			e.preventDefault();
			e.stopPropagation();
			save();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			close();
		}
	}
</script>

<div class="svelte-inline-editor">
	<div class="top-bar">
		<span class="file">{data.loc.file}</span>
		<button class="action" on:click={save}>save</button>
		<button class="action" on:click={close}>&times;</button>
	</div>
	<div class="edit-pane" on:keydown={editorKeyDown}>
		<CodeMirror bind:value={code} on:change={update} lang={html()} theme={oneDark} />
	</div>
</div>

<style>
	.svelte-inline-editor {
		position: fixed;
		bottom: 0;
		margin-left: 50%;
		transform: translateX(-50%);
		width: 80vw;
		cursor: unset !important;

		border: 2px solid #333;
	}
	.top-bar {
		display: flex;
		align-items: center;
		column-gap: 8px;
		background: #282c34;
		color: white;
	}
	.file {
		margin-right: auto;
	}
	button.action {
		all: unset;
		padding: 2px 4px;
		cursor: pointer !important;
		color: white;
	}
	.edit-pane {
		max-height: 30vh;
		overflow-y: auto;
	}
</style>
