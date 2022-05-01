<script>
	// do not use TS here so that this component works in non-ts projects too

	// @ts-expect-error virtual import is resolved by vite-plugin-svelte-inspector
	// eslint-disable-next-line node/no-missing-import
	import icon from 'virtual:svelte-inspector:icon.svg';
	// @ts-expect-error virtual import is resolved by vite-plugin-svelte-inspector
	// eslint-disable-next-line node/no-missing-import
	import options from 'virtual:svelte-inspector-options';
	const modifier_key = options.modifierKey ?? 's';
	let toggle_on = false;
	let modifier_on = false;
	$: enabled = toggle_on || modifier_on;
	let open;
	let x;
	let y;
	$: ({ file, line, column } = parse(open));

	function mousemove(event) {
		if (!enabled) return;
		x = event.x;
		y = event.y;
	}
	function mouseover(event) {
		if (!enabled) return;

		if (event.target.__svelte_meta) {
			event.target.classList.add('svelte-inspector-outline');
		}
		open = event.target.__svelte_meta;
	}
	function mouseout(event) {
		if (!enabled) return;
		if (event.target.__svelte_meta) {
			event.target.classList.remove('svelte-inspector-outline');
		}
	}
	function click() {
		if (!enabled || !file) return;
		fetch(`/__open-in-editor?file=${encodeURIComponent(`${file}:${line}:${column}`)}`);
	}

	function keydown(event) {
		if (event.key === modifier_key) {
			modifier_on = true;
		}
	}
	function keyup(event) {
		if (event.key === modifier_key) {
			modifier_on = false;
		}
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

<svelte:body
	on:mouseover={mouseover}
	on:mousemove={mousemove}
	on:mouseout={mouseout}
	on:click={click}
	on:keydown={keydown}
	on:keyup={keyup} />

<div
	class="toggle svelte-inspector-outline"
	class:enabled
	on:click={() => (toggle_on = !toggle_on)}
	style={`background-image:url(${icon})`}
	alt="sss"
/>

{#if enabled && file}
	<ul class="overlay" style:left="{x + 10}px" style:top="{y + 10}px">
		<li>file: {'<'}{file}{'>'}</li>
		<li>line: {line}</li>
		<li>column: {column}</li>
	</ul>
{/if}

<style>
	:global(.svelte-inspector-outline) {
		outline: 1px dashed #ff3e00;
	}

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
		outline: 1px dashed #ff3e00;
		border-radius: 50%;
		position: fixed;
		top: 8px;
		right: 8px;
		height: 32px;
		width: 32px;
		background-color: white;
		background-size: 80%;
		background-position: center center;
		background-repeat: no-repeat;
		cursor: pointer;
	}

	.toggle:not(.enabled) {
		filter: grayscale(1);
	}
	.toggle:hover {
		background-color: #facece;
	}
</style>
