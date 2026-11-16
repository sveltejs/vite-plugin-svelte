import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { svelteInspector } from '../src/plugins/inspector/index.js';
import { defaultInspectorOptions } from '../src/plugins/inspector/options.js';
import {
	changedOptions,
	validateSettings,
	writeSettings
} from '../src/plugins/inspector/settings.js';

/** @type {string} */
let dir;

beforeEach(() => {
	dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vps-inspector-'));
	delete process.env.SVELTE_INSPECTOR_OPTIONS;
	delete process.env.SVELTE_INSPECTOR_TOGGLE;
});

afterEach(() => {
	fs.rmSync(dir, { recursive: true, force: true });
});

const read = () => fs.readFileSync(path.join(dir, '.env.local'), 'utf-8');

/**
 * @param {any} inspector `inspector` plugin option
 * @param {{ devtools?: boolean; envDir?: string | false }} [opts]
 */
function setup(inspector, { devtools = false, envDir = dir } = {}) {
	const plugin = /** @type {any} */ (
		svelteInspector(/** @type {any} */ ({ options: { inspector } }))
	);
	plugin.configResolved({
		mode: 'development',
		root: dir,
		envDir,
		base: '/',
		plugins: devtools ? [{ name: 'vite:devtools' }, { name: 'vite:devtools:injection' }] : [],
		logger: { error() {} }
	});
	return plugin;
}

/** A fake Vite DevTools node context: records docks and rpc functions */
function fakeDevtools() {
	/** @type {any[]} */
	const docks = [];
	/** @type {Map<string, (params?: any) => Promise<{ ok: boolean; status: string }>>} */
	const actions = new Map();
	const ctx = {
		docks: { register: (/** @type {any} */ entry) => docks.push(entry) },
		rpc: {
			register: (/** @type {any} */ fn) => actions.set(fn.name, fn.setup().handler)
		}
	};
	return { ctx, docks, actions };
}

/**
 * The options the browser gets (the `virtual:svelte-inspector-options` module)
 * @param {any} plugin
 */
async function served_options(plugin) {
	const code = await plugin.load.handler('virtual:svelte-inspector-options');
	return JSON.parse(code.replace(/^export default /, ''));
}

/** what the settings view sends: the full options, without the internal ones */
const form = (/** @type {any} */ options) => {
	const rest = structuredClone(options);
	delete rest.__internal;
	return rest;
};

/** @param {any} plugin */
const injects = (plugin) =>
	plugin.transform.handler('export {}', '/node_modules/vite/dist/client/client.mjs') !== undefined;

describe('inspector with Vite DevTools', () => {
	it('is enabled from the dock without inspector options, and does not inject itself', () => {
		const plugin = setup(undefined, { devtools: true });
		expect(injects(plugin)).toBe(false);

		const { ctx, docks } = fakeDevtools();
		plugin.devtools.setup(ctx);
		expect(docks.map((d) => [d.id, d.type, d.groupId])).toEqual([
			['svelte', 'group', undefined],
			// the picker stays on the bar, one click away
			['svelte:inspector', 'action', undefined],
			// settings live in the Svelte group
			['svelte:inspector-settings', 'custom-render', 'svelte']
		]);
		const [, inspector, settings] = docks;
		expect(inspector.toggle).toBe(true);
		expect(inspector.action.importFrom).toBe('/@id/__x00__virtual:svelte-inspector-dock');
		// its own icon (a magnifier with the Svelte S in its lens), not the generic Svelte icon
		expect(Buffer.from(inspector.icon.split(',')[1], 'base64').toString()).toContain(
			'svelte-inspector-logo'
		);
		// a cog seen through the inspector's glass: the pair of dock entries matches
		expect(Buffer.from(settings.icon.split(',')[1], 'base64').toString()).toContain(
			'svelte-inspector-settings'
		);
		// a hand-written view, mounted into the dock panel by its own client script
		expect(settings.renderer.importFrom).toBe('/@id/__x00__virtual:svelte-inspector-settings');
	});

	it('keeps a Svelte group another plugin registered first', () => {
		const plugin = setup(undefined, { devtools: true });
		const { ctx, docks } = fakeDevtools();
		const register = ctx.docks.register;
		ctx.docks.register = (/** @type {any} */ entry) => {
			if (entry.id === 'svelte') throw new Error('Dock with id "svelte" is already registered');
			register(entry);
		};
		plugin.devtools.setup(ctx);
		expect(docks.map((d) => d.id)).toEqual(['svelte:inspector', 'svelte:inspector-settings']);
	});

	it('stays off with `inspector: false`', () => {
		const plugin = setup(false, { devtools: true });
		const { ctx, docks } = fakeDevtools();
		plugin.devtools.setup(ctx);
		expect(docks).toEqual([]);
		expect(plugin.applyToEnvironment({ config: { consumer: 'client' } })).toBe(false);
	});

	it('stays off with SVELTE_INSPECTOR_OPTIONS=false', () => {
		process.env.SVELTE_INSPECTOR_OPTIONS = 'false';
		const plugin = setup(undefined, { devtools: true });
		const { ctx, docks } = fakeDevtools();
		plugin.devtools.setup(ctx);
		expect(docks).toEqual([]);
	});
});

describe('inspector without Vite DevTools', () => {
	it('injects itself into the vite client when enabled', () => {
		const plugin = setup(true);
		expect(injects(plugin)).toBe(true);
		const { ctx, docks } = fakeDevtools();
		plugin.devtools.setup(ctx);
		expect(docks).toEqual([]);
	});

	it('is off without options', () => {
		const plugin = setup(undefined);
		expect(plugin.applyToEnvironment({ config: { consumer: 'client' } })).toBe(false);
	});
});

describe('inspector settings view', () => {
	it('saves the options that differ from the Svelte config to .env.local', async () => {
		const plugin = setup({ toggleKeyCombo: 'control-i' }, { devtools: true });
		const { ctx, actions } = fakeDevtools();
		plugin.devtools.setup(ctx);
		const current = await served_options(plugin);
		expect(current.toggleKeyCombo).toBe('control-i');
		// the view's defaults: what "Reset to defaults" returns to (the Svelte config, not .env.local)
		expect(current.__internal.defaults).toEqual({
			...defaultInspectorOptions,
			toggleKeyCombo: 'control-i'
		});

		const saved = await actions.get('svelte:inspector:save-settings')?.({
			...form(current),
			holdMode: false,
			escapeKeys: ['Escape']
		});
		// the config file's combo is the base: only what differs from it is saved
		expect(read()).toBe(
			'SVELTE_INSPECTOR_OPTIONS=\'{"holdMode":false,"escapeKeys":["Escape"]}\'\n'
		);
		expect(saved).toEqual({ ok: true, status: 'Saved to .env.local. Restarting…' });

		const reset = await actions.get('svelte:inspector:reset-settings')?.();
		// nothing else was in it
		expect(fs.existsSync(path.join(dir, '.env.local'))).toBe(false);
		expect(reset?.ok).toBe(true);
		expect(reset?.status).toMatch(/^Reset/);
	});

	it('reports invalid input instead of saving', async () => {
		const plugin = setup(undefined, { devtools: true });
		const { ctx, actions } = fakeDevtools();
		plugin.devtools.setup(ctx);
		const result = await actions.get('svelte:inspector:save-settings')?.({
			...form(await served_options(plugin)),
			openKey: '  '
		});
		expect(result).toEqual({ ok: false, status: 'Open in editor needs a key' });
		expect(fs.existsSync(path.join(dir, '.env.local'))).toBe(false);
	});

	it('says when an env file of the mode overrides the saved settings', async () => {
		fs.writeFileSync(path.join(dir, '.env.development'), "SVELTE_INSPECTOR_OPTIONS='{}'\n");
		const plugin = setup(undefined, { devtools: true });
		const { ctx, actions } = fakeDevtools();
		plugin.devtools.setup(ctx);
		const saved = await actions.get('svelte:inspector:save-settings')?.({
			...form(await served_options(plugin)),
			toggleKeyCombo: 'meta-k'
		});
		expect(saved?.ok).toBe(true);
		expect(saved?.status).toContain(
			'SVELTE_INSPECTOR_OPTIONS is also set in .env.development, which takes precedence.'
		);
	});

	it('does not save when Vite loads no env files', async () => {
		const plugin = setup(undefined, { devtools: true, envDir: false });
		const { ctx, actions } = fakeDevtools();
		plugin.devtools.setup(ctx);
		const saved = await actions.get('svelte:inspector:save-settings')?.({
			...form(await served_options(plugin)),
			toggleKeyCombo: 'meta-k'
		});
		expect(saved?.ok).toBe(false);
		expect(saved?.status).toMatch(/envDir: false/);
		expect(fs.existsSync(path.join(dir, '.env.local'))).toBe(false);
	});

	it('saved settings are what the plugin serves on the next start', async () => {
		const plugin = setup(undefined, { devtools: true });
		const { ctx, actions } = fakeDevtools();
		plugin.devtools.setup(ctx);
		await actions.get('svelte:inspector:save-settings')?.({
			...form(await served_options(plugin)),
			toggleKeyCombo: 'meta-k'
		});

		// a restart: the env file is loaded again
		const restarted = setup(undefined, { devtools: true });
		expect((await served_options(restarted)).toggleKeyCombo).toBe('meta-k');
	});
});

describe('settings helpers', () => {
	it('accepts the default options as they are', () => {
		// the toggle button's options are left out: the dock replaces the button
		const settings = structuredClone(defaultInspectorOptions);
		delete settings.showToggleButton;
		delete settings.toggleButtonPos;
		expect(validateSettings(structuredClone(defaultInspectorOptions))).toEqual({
			options: settings
		});
	});

	/** @param {Record<string, unknown>} patch */
	const settings = (patch) => ({ ...structuredClone(defaultInspectorOptions), ...patch });
	it.each([
		[settings({ toggleKeyCombo: '' }), 'Shortcut needs a key'],
		[settings({ openKey: "'" }), "Open in editor can't be '"],
		[settings({ escapeKeys: [] }), 'Stop picking needs at least one key'],
		[null, 'No settings to save']
	])('rejects %j', (input, error) => {
		expect(validateSettings(input)).toEqual({ error });
	});

	it('lists only changed options', () => {
		expect(
			changedOptions(
				{
					...defaultInspectorOptions,
					holdMode: false,
					navKeys: { ...defaultInspectorOptions.navKeys }
				},
				defaultInspectorOptions
			)
		).toEqual({ holdMode: false });
	});

	it('keeps other variables in .env.local', () => {
		fs.writeFileSync(path.join(dir, '.env.local'), 'A=1\nSVELTE_INSPECTOR_OPTIONS=old\nB=2\n');
		writeSettings(dir, { holdMode: false });
		expect(read()).toBe('A=1\nB=2\nSVELTE_INSPECTOR_OPTIONS=\'{"holdMode":false}\'\n');
		writeSettings(dir, null);
		expect(read()).toBe('A=1\nB=2\n');
	});

	it('does not create .env.local just to remove the variable', () => {
		writeSettings(dir, null);
		expect(fs.existsSync(path.join(dir, '.env.local'))).toBe(false);
	});
});
