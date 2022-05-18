<script>
	import { createEventDispatcher } from 'svelte';
	export let data;
	let code = data.content; // TODO update when data changes
	const dispatch = createEventDispatcher();

	function save() {
		dispatch('save', { data, code });
	}
	function close() {
		dispatch('close');
	}
</script>

<div class="svelte-inline-editor">
	<div class="top-bar">
		<span class="file">{data.loc.file}</span>
		<button class="action" on:click={save}>save</button>
		<button class="action" on:click={close}>&times;</button>
	</div>
	<pre class="edit-pane">
	  <code contenteditable="true" bind:textContent={code} />
	</pre>
</div>

<style>
	.svelte-inline-editor {
		position: fixed;
		bottom: 0;
		height: auto;
		margin-left: 50%;
		transform: translateX(-50%);
		overflow-y: visible;
		max-width: 80vw;
		background-color: #333;
		color: #eee;
		border: 2px solid #333;
	}
	.top-bar {
		display: flex;
		align-items: center;
		column-gap: 8px;
	}
	.file {
		margin-right: auto;
	}
	.action {
		padding: 2px 4px;
		cursor: pointer !important;
	}
	.edit-pane {
		max-height: 30vh;
		overflow: auto;
		cursor: text !important;
		background-color: #333;
		color: #eee;
		outline: none;
	}
</style>
