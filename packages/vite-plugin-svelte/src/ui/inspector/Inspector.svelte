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

	let enabled = false;

	// location of code in file
	let fileLoc;
	// cursor pos and width for fileLoc overlay positioning
	let x, y, w;

	let activeTarget;

	function mousemove(event) {
		x = event.x;
		y = event.y;
	}

	function findMetaEl(el) {
		while (el) {
			const file = el.__svelte_meta?.loc?.file;
			if (file && !file.includes('node_modules/')) {
				return el;
			}
			el = el.parentNode;
		}
	}

	function mouseover(event) {
		const el = findMetaEl(event.target);
		if (options.customStyles && el !== activeTarget) {
			if (activeTarget) {
				activeTarget.classList.remove('svelte-inspector-active-target');
			}
			if (el) {
				el.classList.add('svelte-inspector-active-target');
			}
		}
		if (el) {
			const { file, line, column } = el.__svelte_meta.loc;
			fileLoc = `${file}:${line + 1}:${column + 1}`;
		} else {
			fileLoc = null;
		}
		activeTarget = el;
	}

	function click(event) {
		if (fileLoc) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			fetch(`/__open-in-editor?file=${encodeURIComponent(fileLoc)}`);
		}
	}

	function is_toggle(event) {
		return toggle_combo && event.key === toggle_combo[1] && event[toggle_combo[0] + 'Key'];
	}

	function keydown(event) {
		if (!event.repeat && is_toggle(event)) {
			toggle();
		}
	}

	function toggle() {
		enabled ? disable() : enable();
	}

	function listeners(body, enabled) {
		const l = enabled ? body.addEventListener : body.removeEventListener;
		l('mousemove', mousemove);
		l('mouseover', mouseover);
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
			activeTarget?.classList.remove('svelte-inspector-active-target');
		}
	}

	onMount(() => {
		if (toggle_combo) {
			document.body.addEventListener('keydown', keydown);
		}

		return () => {
			// make sure we get rid of everything
			disable();
			if (toggle_combo) {
				document.body.removeEventListener('keydown', keydown);
			}
		};
	});
</script>

{#if options.showToggleButton || enabled}
	<div
		class="svelte-inspector-toggle"
		class:enabled
		style={`background-image:url(${icon})`}
		on:click={() => toggle()}
	/>
{/if}
{#if enabled && fileLoc}
	<div
		class="svelte-inspector-overlay"
		style:left="{Math.min(x + 3, document.body.clientWidth - w - 10)}px"
		style:top="{y + 30}px"
		bind:offsetWidth={w}
	>
		{fileLoc}
	</div>
{/if}

<style>
	:global(body.svelte-inspector-enabled *) {
		cursor: var(--svelte-inspector-cursor), crosshair !important;
	}
	:global(.svelte-inspector-active-target) {
		outline: 2px dashed #ff3e00 !important;
	}

	.svelte-inspector-overlay {
		position: fixed;
		background-color: rgba(0, 0, 0, 0.8);
		color: #fff;
		padding: 2px 4px;
		border-radius: 5px;
		z-index: 999999;
	}

	.svelte-inspector-toggle {
		border: 1px solid #ff3e00;
		border-radius: 8px;
		position: fixed;
		top: 8px;
		right: 8px;
		height: 32px;
		width: 32px;
		background-color: white;
		background-position: center;
		background-repeat: no-repeat;
		cursor: pointer;
	}

	.svelte-inspector-toggle:not(.enabled) {
		filter: grayscale(1);
	}
	.svelte-inspector-toggle:hover {
		background-color: #facece;
	}
</style>
