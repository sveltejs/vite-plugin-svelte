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
	const hold_key = options.holdKey;

	let enabled = false;

	// location of code in file
	let fileLoc;
	// cursor pos and width for fileLoc overlay positioning
	let x, y, w;

	let toggleEl;

	function mousemove(event) {
		x = event.x;
		y = event.y;
	}

	function mouseover(event) {
		const meta = event.target.__svelte_meta;
		if (options.customStyles && meta) {
			event.target.classList.add('svelte-inspector-active-target');
		}
		if (meta && event.target !== toggleEl) {
			const { file, line, column } = meta.loc;
			fileLoc = `${file}:${line + 1}:${column + 1}`;
		} else {
			fileLoc = null;
		}
	}

	function mouseout(event) {
		if (options.customStyles) {
			event.target.classList.remove('svelte-inspector-active-target');
		}
	}

	function click(event) {
		if (!fileLoc) return;
		fetch(`/__open-in-editor?file=${encodeURIComponent(fileLoc)}`);
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
	}

	function is_toggle(event) {
		return toggle_combo && event.key === toggle_combo[1] && event[toggle_combo[0] + 'Key'];
	}

	function is_hold(event) {
		return hold_key && event.key === hold_key && !(event.shiftKey || event.altKey || event.ctrlKey);
	}

	function keydown(event) {
		if (is_toggle(event)) {
			toggle();
		} else if (is_hold(event)) {
			enable();
		}
	}

	function keyup(event) {
		if (enabled && is_hold(event)) {
			disable();
		}
	}

	function toggle() {
		enabled ? disable() : enable();
	}

	function listeners(body, enabled) {
		const l = enabled ? body.addEventListener : body.removeEventListener;
		l('mousemove', mousemove);
		l('mouseover', mouseover);
		l('mouseout', mouseout);
		l('click', click, true);
	}

	function enable() {
		enabled = true;
		const b = document.body;
		if (options.customStyles) {
			b.classList.add('svelte-inspector-enabled');
			b.style.setProperty('--svelte-inspector-cursor', `url(${JSON.stringify(icon)})`);
		}
		listeners(b, enabled);
	}
	function disable() {
		enabled = false;
		const b = document.body;
		listeners(b, enabled);
		if (options.customStyles) {
			b.classList.remove('svelte-inspector-enabled');
			b.style.removeProperty('--svelte-inspector-cursor');
			b.querySelectorAll('.svelte-inspector-active-target').forEach((el) =>
				el.classList.remove('svelte-inspector-active-target')
			);
		}
	}

	onMount(() => {
		if (toggle_combo || hold_key) {
			document.body.addEventListener('keydown', keydown);
		}
		if (hold_key) {
			document.body.addEventListener('keyup', keyup);
		}
		return () => {
			// make sure we get rid of everything
			disable();
			document.body.removeEventListener('keydown', keydown);
			document.body.removeEventListener('keyup', keyup);
		};
	});
</script>

{#if options.showToggleButton || enabled}
	<div
		bind:this={toggleEl}
		class="toggle"
		class:enabled
		style={`background-image:url(${icon})`}
		on:click={() => toggle()}
	/>
{/if}
{#if enabled && fileLoc}
	<div
		class="overlay"
		style:left="{Math.min(x + 3, document.body.clientWidth - w - 10)}px"
		style:top="{y + 30}px"
		bind:offsetWidth={w}
	>
		{fileLoc}
	</div>
{/if}

<style>
	:global(body.svelte-inspector-enabled) {
		cursor: var(--svelte-inspector-cursor), crosshair !important;
	}
	:global(.svelte-inspector-active-target) {
		outline: 1px dashed #ff3e00 !important;
		cursor: var(--svelte-inspector-cursor), crosshair !important;
	}

	.overlay {
		position: fixed;
		background-color: rgba(0, 0, 0, 0.8);
		color: #fff;
		padding: 2px 4px;
		border-radius: 5px;
	}

	.toggle {
		border: 1px solid #ff3e00;
		border-radius: 8px;
		position: fixed;
		top: 8px;
		right: 8px;
		height: 32px;
		width: 32px;
		background-color: white;
		background-position: 6px 5px;
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
