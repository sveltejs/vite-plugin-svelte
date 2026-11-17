// Client script of the `svelte:inspector` dock action
// eslint-disable-next-line n/no-missing-import
import Inspector from 'virtual:svelte-inspector-path:Inspector.svelte';
// eslint-disable-next-line n/no-missing-import
import options from 'virtual:svelte-inspector-options';
import { mount } from 'svelte';

// devtools leave this component, what it renders and its state out of their panels
/** @type {any} */ (Inspector)[Symbol.for('svelte.devtools.ignore')] = true;

/**
 * @param {string} file
 * @returns {string} `file` resolved against the vite root (Vite DevTools opens paths inside its workspace)
 */
function absolute(file) {
	const root = options.__internal?.root;
	if (!root || file.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(file)) return file;
	return `${root.replace(/[\\/]$/, '')}/${file}`;
}

/**
 * @param {any} ctx devframe dock client script context (`DockClientScriptContext`)
 */
export default function setup(ctx) {
	const id = ctx.current.entryMeta.id;
	const docks = ctx.docks ?? ctx;

	const target = document.createElement('div');
	target.setAttribute('id', 'svelte-inspector-host');
	document.documentElement.appendChild(target);

	const inspector = /** @type {{ enable(): void; disable(): void }} */ (
		/** @type {unknown} */ (
			mount(Inspector, {
				target,
				props: {
					host: {
						/** @param {{ file: string; line: number; column: number }} loc */
						openInEditor(loc) {
							ctx.rpc
								.call(
									'vite:core:open-in-editor',
									`${absolute(loc.file)}:${loc.line}:${loc.column + 1}`
								)
								.catch(
									/** @param {unknown} e */ (e) =>
										// eslint-disable-next-line no-console -- shown in the page console, like vite client errors
										console.error('[svelte-inspector] failed to open editor', e)
								);
						},
						/** @param {Event} e */
						ignore(e) {
							// the dock is rendered in the page
							return e
								.composedPath()
								.some((node) => node instanceof Element && node.tagName.startsWith('DEVFRAMES-'));
						},
						/** @param {boolean} enabled */
						onenabledchange(enabled) {
							// sync the dock button when the inspector toggles itself
							if (ctx.current.isActive !== enabled) docks.setActionActive(id, enabled);
						}
					}
				}
			})
		)
	);

	// client-side so it toggles this tab only; not Alt-based, as Alt+letter types characters on macOS
	ctx.commands?.register({
		id: 'svelte:toggle-inspector',
		source: 'client',
		title: 'Toggle Svelte Inspector',
		icon: 'logos:svelte-icon',
		category: 'svelte',
		keybindings: [{ key: 'Mod+Shift+X' }],
		action: () => docks.toggleEntry(id)
	});

	// deferred, or the activating click reaches the inspector's window click handler and disables it
	ctx.current.events.on('entry:activated', () => setTimeout(() => inspector.enable()));
	ctx.current.events.on('entry:deactivated', () => inspector.disable());
}
