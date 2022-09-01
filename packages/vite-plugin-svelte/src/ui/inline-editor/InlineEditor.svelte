<script>
	// do not use TS here so that this component works in non-ts projects too
	import { onMount } from 'svelte';
	// eslint-disable-next-line node/no-missing-import
	import options from 'virtual:svelte-inline-editor-options';
	import EditOverlay from 'virtual:svelte-inline-editor-path:EditOverlay.svelte';
	const toggle_combo = options.toggleKeyCombo?.toLowerCase().split('-');

	let enabled = false;

	const icon = `data:image/svg+xml;base64,${btoa(
		`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path d="M 8 19 L 0 12 L 8 5" fill="none" stroke="#222"></path>
  <path d="M 16 19 L 24 12 L 16 5" fill="none" stroke="#222"></path>
  <path d="M 14 2 H 10 M 12 2 V 22 M 14 22 H 10" stroke="#ff3e00"></path>
</svg>
`
			.replace(/[\n\r\t\s]+/g, ' ')
			.trim()
	)}`;

	// location of code in file
	let file_loc;
	let meta;
	// cursor pos and width for file_loc overlay positioning
	let x, y, w;

	let active_el;
	let toggle_el;
	let edit_file;
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
			if (
				el !== toggle_el &&
				file &&
				!file.includes('node_modules/') &&
				!file.includes('vite-plugin-svelte/src/ui')
			) {
				return el;
			}
			el = el.parentNode;
		}
	}

	function mouseover(event) {
		const el = findMetaEl(event.target);
		if (options.customStyles && el !== active_el) {
			if (active_el) {
				active_el.classList.remove('svelte-inline-editor-active-target');
			}
			if (el) {
				el.classList.add('svelte-inline-editor-active-target');
			}
		}
		if (el) {
			meta = el.__svelte_meta;
			const { file, line, column } = meta.loc;
			file_loc = `${file}:${line + 1}:${column + 1}`;
		} else {
			meta = null;
			file_loc = null;
		}
		active_el = el;
	}

	function click(event) {
		if (file_loc) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			import.meta.hot.send('svelte-inline-editor:start', meta);

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
		if (event.repeat || event.key === undefined) {
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
			b.classList.add('svelte-inline-editor-enabled');
		}
		listeners(b, enabled);
	}

	function disable() {
		enabled = false;
		enabled_ts = null;
		const b = document.body;
		listeners(b, enabled);
		if (options.customStyles) {
			b.classList.remove('svelte-inline-editor-enabled');
			active_el?.classList.remove('svelte-inline-editor-active-target');
		}
		active_el = null;
	}

	function save_file(e) {
		const { code, data } = e.detail;
		import.meta.hot.send('svelte-inline-editor:save', {
			code,
			content: data.content,
			file: data.loc.file
		});
		edit_file = null;
	}

	onMount(() => {
		const s = document.createElement('style');
		s.setAttribute('type', 'text/css');
		s.setAttribute('id', 'svelte-inline-editor-style');
		s.textContent = `:root { --svelte-inline-editor-icon: url(${icon})};`;
		document.head.append(s);
		if (toggle_combo) {
			document.body.addEventListener('keydown', keydown);
			if (options.holdMode) {
				document.body.addEventListener('keyup', keyup);
			}
		}
		import.meta.hot.on('svelte-inline-editor:edit', (data) => {
			edit_file = {
				...data,
				el: active_el
			};
		});

		return () => {
			// make sure we get rid of everything
			disable();
			const s = document.head.querySelector('#svelte-inline-editor-style');
			if (s) {
				document.head.removeChild(s);
			}
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
		class="svelte-inline-editor-toggle"
		class:enabled
		style={`background-image: var(--svelte-inline-editor-icon);${options.toggleButtonPos
			.split('-')
			.map((p) => `${p}: 8px;`)
			.join('')}`}
		on:click={() => toggle()}
		bind:this={toggle_el}
	/>
{/if}
{#if enabled && file_loc}
	<div
		class="svelte-inline-editor-overlay"
		style:left="{Math.min(x + 3, document.body.clientWidth - w - 10)}px"
		style:top="{y + 30}px"
		bind:offsetWidth={w}
	>
		{file_loc}
	</div>
{/if}
{#if enabled && edit_file}
	<EditOverlay data={edit_file} on:close={() => (edit_file = null)} on:save={save_file} />
{/if}

<style>
	:global(body.svelte-inline-editor-enabled *) {
	}
	:global(.svelte-inline-editor-active-target) {
		cursor: var(--svelte-inline-editor-icon), text !important;
		outline: 2px dashed #ff3e00 !important;
	}

	.svelte-inline-editor-overlay {
		position: fixed;
		background-color: rgba(0, 0, 0, 0.8);
		color: #fff;
		padding: 2px 4px;
		border-radius: 5px;
		z-index: 999999;
	}

	.svelte-inline-editor-toggle {
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

	.svelte-inline-editor-toggle:not(.enabled) {
		filter: grayscale(1);
	}
	.svelte-inline-editor-toggle:hover {
		background-color: #facece;
	}
</style>
