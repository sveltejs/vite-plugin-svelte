/** @import { InspectorOptions } from '../../public.js' */

import fs from 'node:fs';
import path from 'node:path';
import { SETTINGS_FILE } from './runtime/settings-constants.js';

const ENV_KEY = 'SVELTE_INSPECTOR_OPTIONS';

/** @param {string} line */
const sets_key = (line) => new RegExp(`^\\s*(export\\s+)?${ENV_KEY}\\s*=`).test(line);

/**
 * Check the options the settings view sends before they are written to an env file
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
				customStyles: input.customStyles === true
			}
		};
	} catch (e) {
		return { error: /** @type {Error} */ (e).message };
	}
}

/**
 * The options in `options` that differ from `base`
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
 * Set `SVELTE_INSPECTOR_OPTIONS` in `dir`'s .env.local, keeping other lines. `null` or `{}` removes
 * it, and the file if nothing else is left.
 * @param {string} dir
 * @param {Record<string, unknown> | null} options
 * @returns {string} the file written
 */
export function writeSettings(dir, options) {
	const file = path.join(dir, SETTINGS_FILE);
	const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
	const lines = existing === '' ? [] : existing.replace(/\r?\n$/, '').split(/\r?\n/);
	const kept = lines.filter((line) => !sets_key(line));
	if (options && Object.keys(options).length > 0) {
		kept.push(`${ENV_KEY}='${JSON.stringify(options)}'`);
	}
	if (kept.length > 0) {
		fs.writeFileSync(file, `${kept.join('\n')}\n`);
	} else if (existing !== '') {
		fs.rmSync(file);
	}
	return file;
}

/**
 * The env files in `dir` that Vite loads after `.env.local` for `mode` and that also set
 * `SVELTE_INSPECTOR_OPTIONS`: their value wins over the saved settings.
 * @param {string} dir
 * @param {string} mode
 * @returns {string[]} file names
 */
export function overridingEnvFiles(dir, mode) {
	return [`.env.${mode}`, `.env.${mode}.local`].filter((name) => {
		const file = path.join(dir, name);
		return fs.existsSync(file) && fs.readFileSync(file, 'utf-8').split(/\r?\n/).some(sets_key);
	});
}
