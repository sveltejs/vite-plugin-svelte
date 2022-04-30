<script>
	import { onMount } from 'svelte';
	// @ts-expect-error virtual import is resolved by vite-plugin-svelte-inspector
	// eslint-disable-next-line node/no-missing-import
	import icon from 'virtual:svelte-inspector:icon.svg';
	let enabled = false;
	let open;
	let x;
	let y;
	$: ({ file, line, column } = parse(open));

	onMount(() => {
		document.body.addEventListener('mouseover', mouseover);
		document.body.addEventListener('mousemove', mousemove);
		document.body.addEventListener('click', click);
		return () => {
			document.body.removeEventListener('mouseover', mouseover);
			document.body.removeEventListener('mousemove', mousemove);
			document.body.removeEventListener('click', click);
		};
	});
	function mousemove(event) {
		if (!enabled) return;
		x = event.x;
		y = event.y;
	}
	function mouseover(event) {
		if (!enabled) return;
		open = event.target.__svelte_meta;
	}
	function click() {
		if (!enabled || !file) return;
		fetch(`/__open-in-editor?file=${encodeURIComponent(`${file}:${line}:${column}`)}`);
	}
	function parse(open) {
		if (open) {
			const {
				loc: { file, line, column }
			} = open;
			return { file, line: line + 1, column: column + 1 };
		}
		return {};
	}
</script>

<div class="toggle" class:enabled on:click={() => (enabled = !enabled)}>
	<img src={icon} alt="logo" />
</div>

{#if enabled && file}
	<ul class="overlay" style:left="{x + 10}px" style:top="{y + 10}px">
		<li>file: {'<'}{file}{'>'}</li>
		<li>line: {line}</li>
		<li>column: {column}</li>
	</ul>
{/if}

<style>
	.overlay {
		position: fixed;
		border: 2px dashed #666;
		background-color: rgba(0, 0, 0, 0.8);
		color: #fff;
		padding: 10px;
		border-radius: 5px;
		text-align: left;
	}
	ul {
		list-style-type: none;
	}
	.toggle {
		border-radius: 50%;
		position: fixed;
		top: 10px;
		right: 10px;
		height: 50px;
		width: 50px;
		background: white;
		border: 2px solid red;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	img {
		width: 80%;
		height: 80%;
		margin-top: 3px;
	}
	.toggle:not(.enabled) {
		border-color: gray;
		border-style: dashed;
		filter: grayscale(1);
	}
	.toggle:hover {
		background: #facece;
	}
</style>
