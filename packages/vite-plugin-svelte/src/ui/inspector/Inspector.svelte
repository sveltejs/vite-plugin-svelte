<script>
	// do not use TS here so that this component works in non-ts projects too
	import { onMount } from 'svelte';
	// @ts-expect-error virtual import is resolved by vite-plugin-svelte-inspector
	// eslint-disable-next-line node/no-missing-import
	import icon from 'virtual:svelte-inspector:icon.svg';
	// @ts-expect-error virtual import is resolved by vite-plugin-svelte-inspector
	// eslint-disable-next-line node/no-missing-import
	import options from 'virtual:svelte-inspector-options';
	const toggle_combo = options.toggleKeyCombo?.toLowerCase().split('-');
	const hold_key = options.holdKey?.substring(0, 1).toLowerCase();
	let toggleEl;
	let enabled = false;
	let open;
	let x;
	let y;
	$: ({ file, line, column } = parse(open));

	function mousemove(event) {
		x = event.x;
		y = event.y;
	}

	function mouseover(event) {
		if (options.customStyles && event.target.__svelte_meta) {
			event.target.classList.add('svelte-inspector-outline');
		}
		open = event.target !== toggleEl ? event.target.__svelte_meta : undefined;
	}

	function mouseout(event) {
		event.target.classList.remove('svelte-inspector-outline');
	}

	function click(event) {
		if (!file) return;
		fetch(`/__open-in-editor?file=${encodeURIComponent(`${file}:${line}:${column}`)}`);
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
	}

	function keydown(event) {
		if (toggle_combo && event.key === toggle_combo[1] && event[toggle_combo[0] + 'Key']) {
			toggle();
		} else if (hold_key && event.key === hold_key) {
			enable();
		}
	}

	function keyup(event) {
		if (
			!enabled ||
			(toggle_combo && event.key === toggle_combo[1] && event[toggle_combo[0] + 'Key'])
		) {
			return;
		}

		if (hold_key && event.key === hold_key) {
			disable();
		}
	}

	function parse(open) {
		if (open) {
			const {
				loc: { file, line, column }
			} = open;
			if (!file.includes('@sveltejs/vite-plugin-svelte/src/ui')) {
				return { file, line: line + 1, column: column + 1 };
			}
		}
		return {};
	}

	function toggle() {
		enabled ? disable() : enable();
	}

	function enable() {
		enabled = true;
		if (options.customStyles) {
			document.body.classList.add('svelte-inspector-enabled');
		}
		document.body.addEventListener('mousemove', mousemove);
		document.body.addEventListener('mouseover', mouseover);
		document.body.addEventListener('mouseout', mouseout);
		document.body.addEventListener('click', click, true);
	}
	function disable() {
		enabled = false;
		document.body.removeEventListener('mousemove', mousemove);
		document.body.removeEventListener('mouseover', mouseover);
		document.body.removeEventListener('mouseout', mouseout);
		document.body.removeEventListener('click', click, true);
		document.body.classList.remove('svelte-inspector-enabled');
		document
			.querySelectorAll('.svelte-inspector-outline')
			.forEach((e) => e.classList.remove('svelte-inspector-outline'));
	}

	onMount(() => {
		if (toggle_combo || hold_key) {
			document.body.addEventListener('keydown', keydown);
		}
		if (hold_key) {
			document.body.addEventListener('keyup', keyup);
		}
		return () => {
			disable();
			document.body.removeEventListener('keydown', keydown);
			document.body.removeEventListener('keyup', keyup);
		};
	});
</script>

{#if options.showDisabledButton || !options.toggleKeyCombo || enabled}
	<div
		bind:this={toggleEl}
		class="toggle"
		class:enabled
		style={`background-image:url(${icon})`}
		on:click={() => toggle()}
	/>
{/if}
{#if enabled && file}
	<div class="overlay" style:left="{x + 10}px" style:top="{y + 10}px">
		{file}:{line}:{column}
	</div>
{/if}

<style>
	:global(body.svelte-inspector-enabled) {
		cursor: crosshair !important;
	}
	:global(.svelte-inspector-outline) {
		outline: 1px dashed #ff3e00 !important;
		cursor: crosshair !important;
	}

	.overlay {
		position: fixed;
		background-color: rgba(0, 0, 0, 0.8);
		color: #fff;
		padding: 2px 4px;
		border-radius: 5px;
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
