// Client script of the `svelte:inspector` toggle action in the Vite DevTools dock.
// eslint-disable-next-line n/no-missing-import
import Inspector from 'virtual:svelte-inspector-path:Inspector.svelte';
// eslint-disable-next-line n/no-missing-import
import options from 'virtual:svelte-inspector-options';
import { mount } from 'svelte';

// part of the devtools, not the app: devtools leave this component, what it renders and its
// state out of their panels (the shared marker for devtools UIs mounted into the page)
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
	// the docks api is on `ctx.docks` in the embedded client
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
							// the dock is rendered in the page (custom elements in `<body>`)
							return e
								.composedPath()
								.some((node) => node instanceof Element && node.tagName.startsWith('DEVFRAMES-'));
						},
						/** @param {boolean} enabled */
						onenabledchange(enabled) {
							// keep the dock button in sync when the key combo, escape or a click toggled the inspector
							if (ctx.current.isActive !== enabled) docks.setActionActive(id, enabled);
						}
					}
				}
			})
		)
	);

	// a command for the palette with its own shortcut, rebindable in the dock's settings (not
	// Alt-based like `toggleKeyCombo`: Alt+letter types characters on macOS). Registered here, in
	// the page, so it toggles this tab only.
	ctx.commands?.register({
		id: 'svelte:toggle-inspector',
		source: 'client',
		title: 'Toggle Svelte Inspector',
		icon: 'logos:svelte-icon',
		category: 'svelte',
		keybindings: [{ key: 'Mod+Shift+X' }],
		action: () => docks.toggleEntry(id)
	});

	// deferred: the click that activated the dock entry would otherwise reach the inspector's
	// window click handler, which disables it again
	ctx.current.events.on('entry:activated', () => setTimeout(() => inspector.enable()));
	ctx.current.events.on('entry:deactivated', () => inspector.disable());
}
