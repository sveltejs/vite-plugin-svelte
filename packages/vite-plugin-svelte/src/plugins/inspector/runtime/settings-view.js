// Client script of the `svelte:inspector-settings` dock view
// eslint-disable-next-line n/no-missing-import
import SettingsView from 'virtual:svelte-inspector-path:SettingsView.svelte';
// eslint-disable-next-line n/no-missing-import
import options from 'virtual:svelte-inspector-options';
import { mount, unmount } from 'svelte';
import { RESET_SETTINGS, SAVE_SETTINGS, SETTINGS_FILE } from './settings-constants.js';

// devtools leave this component, what it renders and its state out of their panels
/** @type {any} */ (SettingsView)[Symbol.for('svelte.devtools.ignore')] = true;

/** the dock's colour scheme root, whose class is `light` or `dark` */
function dock_theme_root() {
	const host = document.querySelector('devframes-dock-embedded');
	return host?.shadowRoot?.querySelector('.devframes-color-root') ?? null;
}

/**
 * @param {any} ctx devframe dock client script context (`DockClientScriptContext`)
 */
export default function setup(ctx) {
	/** @type {Record<string, any> | null} */
	let view = null;
	/** @type {MutationObserver | null} */
	let observer = null;

	/** @param {string} name */
	const call = async (name, /** @type {unknown[]} */ ...args) =>
		/** @type {{ ok: boolean; status: string }} */ (await ctx.rpc.call(name, ...args));

	/** @param {HTMLElement} panel */
	const render = (panel) => {
		if (view) unmount(view);
		observer?.disconnect();

		const target = document.createElement('div');
		target.style.height = '100%';
		panel.replaceChildren(target);

		// the dock's own light/dark setting, not only the OS one
		const theme_root = dock_theme_root();
		const sync = () => {
			const dark = theme_root
				? theme_root.classList.contains('dark')
				: matchMedia('(prefers-color-scheme: dark)').matches;
			target.firstElementChild?.setAttribute('data-theme', dark ? 'dark' : 'light');
		};
		if (theme_root) {
			observer = new MutationObserver(sync);
			observer.observe(theme_root, { attributes: true, attributeFilter: ['class'] });
		}

		/** @type {Record<string, unknown>} */
		const current = { ...options };
		delete current.__internal;
		const defaults = options.__internal?.defaults ?? current;
		view = mount(SettingsView, {
			target,
			props: {
				current,
				defaults,
				file: SETTINGS_FILE,
				save: (/** @type {unknown} */ settings) => call(SAVE_SETTINGS, settings),
				reset: () => call(RESET_SETTINGS)
			}
		});
		sync();
	};

	// the dock may create the panel before this script loads
	ctx.current.events.on('dom:panel:mounted', render);
	const existing = ctx.current.domElements?.panel;
	if (existing) render(existing);
}
