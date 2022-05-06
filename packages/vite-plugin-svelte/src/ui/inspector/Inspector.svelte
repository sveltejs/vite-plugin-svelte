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
	let file_loc;
	// cursor pos and width for file_loc overlay positioning
	let x, y, w;

	let active_el;
	let toggle_el;

	let enabled_ts;

	$: show_toggle =
		options.showToggleButton === 'always' || (options.showToggleButton === 'active' && enabled);

	function mousemove(event) {
		x = event.x;
		y = event.y;
	}

	function findMetaEl(el) {
		while (el) {
			const file = el.__svelte_meta?.loc?.file;
			if (el !== toggle_el && file && !file.includes('node_modules/')) {
				return el;
			}
			el = el.parentNode;
		}
	}

	function mouseover(event) {
		const el = findMetaEl(event.target);
		if (options.customStyles && el !== active_el) {
			if (active_el) {
				active_el.classList.remove('svelte-inspector-active-target');
			}
			if (el) {
				el.classList.add('svelte-inspector-active-target');
			}
		}
		if (el) {
			const { file, line, column } = el.__svelte_meta.loc;
			file_loc = `${file}:${line + 1}:${column + 1}`;
		} else {
			file_loc = null;
		}
		active_el = el;
	}

	function click(event) {
		if (file_loc) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			fetch(`/__open-in-editor?file=${encodeURIComponent(file_loc)}`);
			if (options.holdMode && is_holding()) {
				disable();
			}
		}
	}

	function is_key_active(key, event) {
		switch (key) {
			case 'shift':
			case 'control':
			case 'alt':
			case 'meta':
				return event.getModifierState(key.charAt(0).toUpperCase() + key.slice(1));
			default:
				return key === event.key.toLowerCase();
		}
	}

	function is_combo(event) {
		return toggle_combo?.every((key) => is_key_active(key, event));
	}

	function is_holding() {
		return enabled_ts && Date.now() - enabled_ts > 250;
	}

	function keydown(event) {
		if (event.repeat) {
			return;
		}

		if (is_combo(event)) {
			toggle();
			if (options.holdMode && enabled) {
				enabled_ts = Date.now();
			}
		}
	}

	function keyup(event) {
		if (event.repeat) {
			return;
		}
		const k = event.key.toLowerCase();
		if (enabled && is_holding() && toggle_combo.includes(k)) {
			disable();
		} else {
			enabled_ts = null;
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
		enabled_ts = null;
		const b = document.body;
		listeners(b, enabled);
		if (options.customStyles) {
			b.classList.remove('svelte-inspector-enabled');
			b.style.removeProperty('--svelte-inspector-cursor');
			active_el?.classList.remove('svelte-inspector-active-target');
		}
	}

	onMount(() => {
		if (toggle_combo) {
			document.body.addEventListener('keydown', keydown);
			if (options.holdMode) {
				document.body.addEventListener('keyup', keyup);
			}
		}
		return () => {
			// make sure we get rid of everything
			disable();
			if (toggle_combo) {
				document.body.removeEventListener('keydown', keydown);
				if (options.holdMode) {
					document.body.addEventListener('keyup', keyup);
				}
			}
		};
	});
</script>

{#if show_toggle}
	<div
		class="svelte-inspector-toggle"
		class:enabled
		style={`background-image:url(${icon});${options.toggleButtonPos
			.split('-')
			.map((p) => `${p}: 8px;`)
			.join('')}`}
		on:click={() => toggle()}
		bind:this={toggle_el}
	/>
{/if}
{#if enabled && file_loc}
	<div
		class="svelte-inspector-overlay"
		style:left="{Math.min(x + 3, document.body.clientWidth - w - 10)}px"
		style:top="{y + 30}px"
		bind:offsetWidth={w}
	>
		{file_loc}
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
