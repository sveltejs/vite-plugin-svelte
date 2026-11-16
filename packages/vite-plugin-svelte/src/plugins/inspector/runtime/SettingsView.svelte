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
		showToggleButton: 'always' | 'active' | 'never';
		toggleButtonPos: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
		customStyles: boolean;
	}

	interface Props {
		/** the options the inspector currently runs with */
		current: Settings;
		/** the options without personal settings (from the defaults and the Svelte config) */
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
	/** personal settings are saved (the inspector does not run with the defaults) */
	const saved = $derived(!same(current, defaults));
	/** nothing to reset: no saved settings, and the form shows the defaults */
	const at_defaults = $derived(!saved && same(form, defaults));

	function reset_to_defaults() {
		// only unsaved edits: put the form back, no need to touch .env.local (or restart)
		if (!saved) {
			form = clone(defaults);
			status = null;
			return;
		}
		run(reset).then((ok) => {
			// only once removed: after a failed reset the saved settings are still the ones in use
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
