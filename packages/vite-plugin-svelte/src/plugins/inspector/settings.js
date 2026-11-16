/** @import { InspectorOptions } from '../../public.js' */

import fs from 'node:fs';
import path from 'node:path';

/** The file personal inspector settings are saved to (Vite loads it; `*.local` is not committed) */
export const SETTINGS_FILE = '.env.local';

const ENV_KEY = 'SVELTE_INSPECTOR_OPTIONS';

const TOGGLE_BUTTON = ['always', 'active', 'never'];
const TOGGLE_BUTTON_POS = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

/**
 * Inspector options from the settings view, checked: what it sends is saved to an env file.
 * @param {any} input
 * @returns {{ options: Omit<InspectorOptions, '__internal'> } | { error: string }}
 */
export function validateSettings(input) {
	/** @param {unknown} value @param {string} label */
	const key = (value, label) => {
		// a single space is a key (the menu key's default); anything else must not be blank
		if (typeof value !== 'string' || value === '' || (value !== ' ' && value.trim() === '')) {
			throw new Error(`${label} needs a key`);
		}
		// saved inside single quotes in the env file, which cannot be escaped
		if (value.includes("'")) throw new Error(`${label} can't be '`);
		return value;
	};
	/** @param {unknown} value @param {string[]} allowed @param {string} label */
	const one_of = (value, allowed, label) => {
		if (typeof value !== 'string' || !allowed.includes(value)) {
			throw new Error(`${label} must be one of ${allowed.join(', ')}`);
		}
		return value;
	};
	try {
		if (input === null || typeof input !== 'object') throw new Error('No settings to save');
		const nav = input.navKeys ?? {};
		const escape = Array.isArray(input.escapeKeys) ? input.escapeKeys : [];
		if (escape.length === 0) throw new Error('Stop picking needs at least one key');
		return {
			options: {
				toggleKeyCombo: key(input.toggleKeyCombo, 'Shortcut').toLowerCase(),
				holdMode: input.holdMode === true,
				openKey: key(input.openKey, 'Open in editor'),
				openMenuKey: key(input.openMenuKey, 'Component menu'),
				escapeKeys: escape.map((/** @type {unknown} */ k) => key(k, 'Stop picking')),
				navKeys: {
					parent: key(nav.parent, 'Parent'),
					child: key(nav.child, 'First child'),
					next: key(nav.next, 'Next sibling'),
					prev: key(nav.prev, 'Previous sibling')
				},
				showToggleButton: /** @type {InspectorOptions['showToggleButton']} */ (
					one_of(input.showToggleButton, TOGGLE_BUTTON, 'Toggle button')
				),
				toggleButtonPos: /** @type {InspectorOptions['toggleButtonPos']} */ (
					one_of(input.toggleButtonPos, TOGGLE_BUTTON_POS, 'Button position')
				),
				customStyles: input.customStyles === true
			}
		};
	} catch (e) {
		return { error: /** @type {Error} */ (e).message };
	}
}

/**
 * The options in `options` that differ from `base` (what the env variable has to override)
 * @param {Partial<InspectorOptions>} options
 * @param {Partial<InspectorOptions>} base
 */
export function changedOptions(options, base) {
	/** @type {Record<string, unknown>} */
	const changed = {};
	for (const [key, value] of Object.entries(options)) {
		if (key === '__internal') continue;
		if (JSON.stringify(value) !== JSON.stringify(/** @type {any} */ (base)[key])) {
			changed[key] = value;
		}
	}
	return changed;
}

/**
 * Write `options` to the env file in `dir` as `SVELTE_INSPECTOR_OPTIONS`, replacing an earlier
 * value and keeping every other line. `null` (or nothing to override) removes the variable, and
 * the file when nothing else is left in it.
 * @param {string} dir
 * @param {Record<string, unknown> | null} options
 * @returns {string} the file written
 */
export function writeSettings(dir, options) {
	const file = path.join(dir, SETTINGS_FILE);
	const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
	const lines = existing === '' ? [] : existing.replace(/\r?\n$/, '').split(/\r?\n/);
	const kept = lines.filter((line) => !new RegExp(`^\\s*(export\\s+)?${ENV_KEY}\\s*=`).test(line));
	if (options && Object.keys(options).length > 0) {
		kept.push(`${ENV_KEY}='${JSON.stringify(options)}'`);
	}
	if (kept.length > 0) {
		fs.writeFileSync(file, `${kept.join('\n')}\n`);
	} else if (existing !== '') {
		// only the inspector's variable was in it
		fs.rmSync(file);
	}
	return file;
}
