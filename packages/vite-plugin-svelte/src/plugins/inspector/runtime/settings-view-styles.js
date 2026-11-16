// Styles of the inspector's settings view in the Vite DevTools dock. Kept as a string and added to
// the panel's own root (the document or a shadow root), since the dock decides where the panel
// lives. Colours follow the dock's theme (`data-theme`, set from the dock's own light/dark mode);
// the accent is Svelte orange, as framework devtools use their own brand colour (Vue and Nuxt
// DevTools use their greens).
export const SETTINGS_VIEW_CSS = `
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
	font: 13px/1.45 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
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
.sis *, .sis *::before, .sis *::after { box-sizing: inherit; }
.sis code { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; }
.sis-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.sis-header h2 { margin: 0; font-size: 16px; font-weight: 600; }
.sis-header p { margin: 2px 0 0; color: var(--sis-muted); }
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
.sis-row + .sis-row { border-top: 1px solid var(--sis-border); }
.sis-row-top { align-items: flex-start; padding-top: 12px; }
.sis label.sis-row { cursor: pointer; }
.sis-label { display: flex; flex-direction: column; min-width: 0; }
.sis-label small { color: var(--sis-muted); font-size: 12px; }
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
.sis-key:hover { background: var(--sis-hover); }
.sis-key:focus-visible, .sis-button:focus-visible, .sis-switch:focus-visible {
	outline: 2px solid var(--sis-accent);
	outline-offset: 1px;
}
.sis-key.recording { border-color: var(--sis-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--sis-accent) 20%, transparent); }
.sis-key kbd {
	padding: 1px 6px;
	border: 1px solid var(--sis-border);
	border-bottom-width: 2px;
	border-radius: 5px;
	background: var(--sis-surface);
	font: 12px ui-monospace, SFMono-Regular, Menlo, monospace;
}
.sis-key-plus { color: var(--sis-muted); }
.sis-key-hint { color: var(--sis-accent); font-size: 12px; padding: 0 4px; }
.sis-keys { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.sis-chip { display: inline-flex; align-items: center; }
.sis-remove, .sis-add {
	border: 0;
	background: none;
	color: var(--sis-muted);
	font: inherit;
	cursor: pointer;
	border-radius: 6px;
	padding: 2px 6px;
}
.sis-remove:hover, .sis-add:hover { background: var(--sis-hover); color: var(--sis-fg); }
.sis-nav { display: grid; grid-template-columns: repeat(2, auto); gap: 6px 14px; }
.sis-nav-item { display: flex; align-items: center; gap: 6px; justify-content: flex-end; }
.sis-nav-label { color: var(--sis-muted); font-size: 12px; }
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
.sis-switch:checked { background: var(--sis-accent); }
.sis-switch:checked::after { transform: translateX(14px); }
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
.sis-status { flex: 1; margin: 0; color: var(--sis-muted); font-size: 12px; }
.sis-status.error { color: var(--sis-danger); }
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
.sis-button:hover:not(:disabled) { background: var(--sis-hover); }
.sis-button.primary { border-color: transparent; background: var(--sis-accent); color: #fff; }
.sis-button.primary:hover:not(:disabled) { background: color-mix(in srgb, var(--sis-accent) 88%, #000); }
.sis-button:disabled { opacity: 0.5; cursor: default; }
`;
