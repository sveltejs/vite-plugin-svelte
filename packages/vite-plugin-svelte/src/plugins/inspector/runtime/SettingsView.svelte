<svelte:options css="injected" />

<script lang="ts">
	import KeyInput from './KeyInput.svelte';
	import { INSPECTOR_ICON_SVG } from './icon.js';

	interface Settings {
		toggleKeyCombo: string;
		holdMode: boolean;
		openKey: string;
		openMenuKey: string;
		escapeKeys: string[];
		navKeys: { parent: string; child: string; next: string; prev: string };
		customStyles: boolean;
	}

	interface Props {
		/** the options the inspector currently runs with */
		current: Settings;
		/** the options without personal settings */
		defaults: Settings;
		/** save the options; resolves to a status message */
		save: (settings: Settings) => Promise<{ ok: boolean; status: string }>;
		reset: () => Promise<{ ok: boolean; status: string }>;
		/** the file settings are saved to */
		file: string;
	}

	let { current, defaults, save, reset, file }: Props = $props();

	const clone = (s: Settings): Settings => JSON.parse(JSON.stringify(s));
	let form = $state(clone(current));
	let status = $state<{ ok: boolean; text: string } | null>(null);
	let busy = $state(false);
	const same = (a: Settings, b: Settings) => JSON.stringify(a) === JSON.stringify(b);
	const dirty = $derived(!same(form, current));
	/** personal settings are saved */
	const saved = $derived(!same(current, defaults));
	/** nothing to reset: no saved settings, and the form shows the defaults */
	const at_defaults = $derived(!saved && same(form, defaults));

	function reset_to_defaults() {
		// only unsaved edits: no need to touch .env.local
		if (!saved) {
			form = clone(defaults);
			status = null;
			return;
		}
		run(reset).then((ok) => {
			// a failed reset leaves the saved settings in use
			if (ok) form = clone(defaults);
		});
	}

	const icon = `data:image/svg+xml;base64,${btoa(INSPECTOR_ICON_SVG)}`;

	async function run(action: () => Promise<{ ok: boolean; status: string }>) {
		busy = true;
		try {
			const r = await action();
			status = { ok: r.ok, text: r.status };
			return r.ok;
		} catch (e) {
			status = { ok: false, text: `Couldn't save: ${(e as Error).message}` };
			return false;
		} finally {
			busy = false;
		}
	}

	function set_escape(i: number, key: string) {
		form.escapeKeys[i] = key;
	}

	const nav = [
		['parent', 'Parent'],
		['child', 'Child'],
		['prev', 'Previous'],
		['next', 'Next']
	] as const;
</script>

<div class="sis">
	<header class="sis-header">
		<img src={icon} alt="" width="28" height="28" />
		<div>
			<h2>Svelte Inspector</h2>
			<p>Your personal settings, saved to <code>{file}</code> (not committed)</p>
		</div>
	</header>

	<section>
		<h3>Activation</h3>
		<div class="sis-row">
			<div class="sis-label">
				<span>Shortcut</span>
				<small>Turns the picker on and off</small>
			</div>
			<KeyInput
				mode="combo"
				label="Shortcut"
				value={form.toggleKeyCombo}
				onchange={(v) => (form.toggleKeyCombo = v)}
			/>
		</div>
		<label class="sis-row">
			<div class="sis-label">
				<span>Hold to inspect</span>
				<small>Only on while the shortcut is held down</small>
			</div>
			<input class="sis-switch" type="checkbox" role="switch" bind:checked={form.holdMode} />
		</label>
	</section>

	<section>
		<h3>Keys while picking</h3>
		<div class="sis-row">
			<div class="sis-label"><span>Open in editor</span></div>
			<KeyInput
				mode="key"
				label="Open in editor"
				value={form.openKey}
				onchange={(v) => (form.openKey = v)}
			/>
		</div>
		<div class="sis-row">
			<div class="sis-label"><span>Component menu</span></div>
			<KeyInput
				mode="key"
				label="Component menu"
				value={form.openMenuKey}
				onchange={(v) => (form.openMenuKey = v)}
			/>
		</div>
		<div class="sis-row">
			<div class="sis-label"><span>Stop picking</span></div>
			<div class="sis-keys">
				{#each form.escapeKeys as key, i (i)}
					<span class="sis-chip">
						<KeyInput
							mode="key"
							label="Stop picking"
							value={key}
							onchange={(v) => set_escape(i, v)}
						/>
						{#if form.escapeKeys.length > 1}
							<button
								type="button"
								class="sis-remove"
								aria-label={`Remove ${key}`}
								onclick={() => form.escapeKeys.splice(i, 1)}>×</button
							>
						{/if}
					</span>
				{/each}
				<button type="button" class="sis-add" onclick={() => form.escapeKeys.push('Escape')}
					>+ Add</button
				>
			</div>
		</div>
		<div class="sis-row sis-row-top">
			<div class="sis-label">
				<span>Move between elements</span>
			</div>
			<div class="sis-nav">
				{#each nav as [name, text] (name)}
					<div class="sis-nav-item" title={text}>
						<span class="sis-nav-label">{text}</span>
						<KeyInput
							mode="key"
							label={text}
							value={form.navKeys[name]}
							onchange={(v) => (form.navKeys[name] = v)}
						/>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section>
		<h3>Appearance</h3>
		<label class="sis-row">
			<div class="sis-label">
				<span>Highlight classes</span>
				<small>Adds <code>svelte-inspector-*</code> classes while picking</small>
			</div>
			<input class="sis-switch" type="checkbox" role="switch" bind:checked={form.customStyles} />
		</label>
	</section>

	<footer class="sis-footer">
		<p class="sis-status" class:error={status && !status.ok} role="status">
			{status?.text ?? (dirty ? 'Unsaved changes' : '')}
		</p>
		<button
			type="button"
			class="sis-button"
			disabled={busy || at_defaults}
			onclick={reset_to_defaults}>Reset to defaults</button
		>
		<button
			type="button"
			class="sis-button primary"
			disabled={busy || !dirty}
			onclick={() => run(() => save($state.snapshot(form)))}>Save</button
		>
	</footer>
</div>

<style>
	/* injected so it reaches the dock panel's shadow root; global as KeyInput.svelte shares it */
	:global {
		.sis {
			--sis-bg: #ffffff;
			--sis-surface: #f6f6f7;
			--sis-fg: #1c1c1f;
			--sis-muted: #6b6b73;
			--sis-border: rgba(0, 0, 0, 0.09);
			--sis-border-strong: rgba(0, 0, 0, 0.16);
			--sis-hover: rgba(0, 0, 0, 0.05);
			--sis-accent: #ff3e00;
			--sis-danger: #d4321c;
			box-sizing: border-box;
			height: 100%;
			overflow: auto;
			padding: 20px 24px 0;
			background: var(--sis-bg);
			color: var(--sis-fg);
			font:
				13px/1.45 ui-sans-serif,
				system-ui,
				-apple-system,
				'Segoe UI',
				sans-serif;
			color-scheme: light;
		}
		.sis[data-theme='dark'] {
			--sis-bg: #151517;
			--sis-surface: #1e1e21;
			--sis-fg: #e9e9ec;
			--sis-muted: #9b9ba3;
			--sis-border: rgba(255, 255, 255, 0.08);
			--sis-border-strong: rgba(255, 255, 255, 0.16);
			--sis-hover: rgba(255, 255, 255, 0.06);
			--sis-danger: #ff7a66;
			color-scheme: dark;
		}
		.sis *,
		.sis *::before,
		.sis *::after {
			box-sizing: inherit;
		}
		.sis code {
			font:
				12px ui-monospace,
				SFMono-Regular,
				Menlo,
				monospace;
		}
		.sis-header {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 20px;
		}
		.sis-header h2 {
			margin: 0;
			font-size: 16px;
			font-weight: 600;
		}
		.sis-header p {
			margin: 2px 0 0;
			color: var(--sis-muted);
		}
		.sis section {
			margin-bottom: 16px;
			border: 1px solid var(--sis-border);
			border-radius: 10px;
			overflow: hidden;
		}
		.sis h3 {
			margin: 0;
			padding: 8px 14px;
			background: var(--sis-surface);
			border-bottom: 1px solid var(--sis-border);
			color: var(--sis-muted);
			font-size: 11px;
			font-weight: 600;
			letter-spacing: 0.04em;
			text-transform: uppercase;
		}
		.sis-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			min-height: 48px;
			padding: 8px 14px;
		}
		.sis-row + .sis-row {
			border-top: 1px solid var(--sis-border);
		}
		.sis-row-top {
			align-items: flex-start;
			padding-top: 12px;
		}
		.sis label.sis-row {
			cursor: pointer;
		}
		.sis-label {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}
		.sis-label small {
			color: var(--sis-muted);
			font-size: 12px;
		}
		.sis-key {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			min-width: 64px;
			height: 28px;
			padding: 0 6px;
			border: 1px solid var(--sis-border-strong);
			border-radius: 7px;
			background: var(--sis-bg);
			color: inherit;
			font: inherit;
			cursor: pointer;
			justify-content: center;
		}
		.sis-key:hover {
			background: var(--sis-hover);
		}
		.sis-key:focus-visible,
		.sis-button:focus-visible,
		.sis-switch:focus-visible {
			outline: 2px solid var(--sis-accent);
			outline-offset: 1px;
		}
		.sis-key.recording {
			border-color: var(--sis-accent);
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--sis-accent) 20%, transparent);
		}
		.sis-key kbd {
			padding: 1px 6px;
			border: 1px solid var(--sis-border);
			border-bottom-width: 2px;
			border-radius: 5px;
			background: var(--sis-surface);
			font:
				12px ui-monospace,
				SFMono-Regular,
				Menlo,
				monospace;
		}
		.sis-key-plus {
			color: var(--sis-muted);
		}
		.sis-key-hint {
			color: var(--sis-accent);
			font-size: 12px;
			padding: 0 4px;
		}
		.sis-keys {
			display: flex;
			flex-wrap: wrap;
			justify-content: flex-end;
			gap: 6px;
		}
		.sis-chip {
			display: inline-flex;
			align-items: center;
		}
		.sis-remove,
		.sis-add {
			border: 0;
			background: none;
			color: var(--sis-muted);
			font: inherit;
			cursor: pointer;
			border-radius: 6px;
			padding: 2px 6px;
		}
		.sis-remove:hover,
		.sis-add:hover {
			background: var(--sis-hover);
			color: var(--sis-fg);
		}
		.sis-nav {
			display: grid;
			grid-template-columns: repeat(2, auto);
			gap: 6px 14px;
		}
		.sis-nav-item {
			display: flex;
			align-items: center;
			gap: 6px;
			justify-content: flex-end;
		}
		.sis-nav-label {
			color: var(--sis-muted);
			font-size: 12px;
		}
		.sis-switch {
			appearance: none;
			flex: none;
			position: relative;
			width: 34px;
			height: 20px;
			margin: 0;
			border-radius: 999px;
			background: var(--sis-border-strong);
			cursor: pointer;
			transition: background 0.15s ease;
		}
		.sis-switch::after {
			content: '';
			position: absolute;
			top: 2px;
			left: 2px;
			width: 16px;
			height: 16px;
			border-radius: 50%;
			background: #fff;
			box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
			transition: transform 0.15s ease;
		}
		.sis-switch:checked {
			background: var(--sis-accent);
		}
		.sis-switch:checked::after {
			transform: translateX(14px);
		}
		.sis-footer {
			position: sticky;
			bottom: 0;
			display: flex;
			align-items: center;
			gap: 8px;
			margin: 0 -24px;
			padding: 12px 24px;
			background: var(--sis-bg);
			border-top: 1px solid var(--sis-border);
		}
		.sis-status {
			flex: 1;
			margin: 0;
			color: var(--sis-muted);
			font-size: 12px;
		}
		.sis-status.error {
			color: var(--sis-danger);
		}
		.sis-button {
			height: 30px;
			padding: 0 14px;
			border: 1px solid var(--sis-border-strong);
			border-radius: 7px;
			background: var(--sis-bg);
			color: inherit;
			font: inherit;
			font-weight: 500;
			cursor: pointer;
		}
		.sis-button:hover:not(:disabled) {
			background: var(--sis-hover);
		}
		.sis-button.primary {
			border-color: transparent;
			background: var(--sis-accent);
			color: #fff;
		}
		.sis-button.primary:hover:not(:disabled) {
			background: color-mix(in srgb, var(--sis-accent) 88%, #000);
		}
		.sis-button:disabled {
			opacity: 0.5;
			cursor: default;
		}
	}
</style>
