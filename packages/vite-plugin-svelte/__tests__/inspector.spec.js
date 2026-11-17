import process from 'node:process';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { svelteInspector } from '../src/plugins/inspector/index.js';
import { log } from '../src/utils/log.js';

// `log.warn.once` is a getter that can't be spied on, and dedupes across tests
vi.mock('../src/utils/log.js', async (importOriginal) => {
	const { log } = /** @type {any} */ (await importOriginal());
	return { log: { ...log, warn: Object.assign(() => {}, { once: vi.fn() }) } };
});

beforeEach(() => {
	delete process.env.SVELTE_INSPECTOR_OPTIONS;
	delete process.env.SVELTE_INSPECTOR_TOGGLE;
	vi.mocked(log.warn.once).mockClear();
});

/**
 * @param {any} inspector `inspector` plugin option
 * @param {{ name: string }[]} [plugins] the other plugins in the Vite config
 */
function setup(inspector, plugins = []) {
	const plugin = /** @type {any} */ (
		svelteInspector(/** @type {any} */ ({ options: { inspector } }))
	);
	plugin.configResolved({
		mode: 'development',
		root: process.cwd(),
		envDir: process.cwd(),
		base: '/',
		plugins,
		logger: { error() {} }
	});
	return plugin;
}

/** @param {any} plugin */
const enabled = (plugin) => plugin.applyToEnvironment({ config: { consumer: 'client' } });

describe('inspector deprecation', () => {
	it('warns once the inspector is enabled', () => {
		expect(enabled(setup(true))).toBe(true);
		expect(log.warn.once).toHaveBeenCalledWith(
			expect.stringContaining('`inspector` option and SVELTE_INSPECTOR_OPTIONS are deprecated'),
			null,
			'inspector'
		);
	});

	it('warns when the environment enables it', () => {
		process.env.SVELTE_INSPECTOR_OPTIONS = 'true';
		expect(enabled(setup(undefined))).toBe(true);
		expect(log.warn.once).toHaveBeenCalled();
	});

	it('does not warn while the inspector is off', () => {
		expect(enabled(setup(undefined))).toBe(false);
		expect(enabled(setup(false))).toBe(false);
		expect(log.warn.once).not.toHaveBeenCalled();
	});

	it('stays off without a warning when the inspector of @sveltejs/vite-devtools-svelte is in the config', () => {
		process.env.SVELTE_INSPECTOR_OPTIONS = '{"holdMode":false}';
		expect(enabled(setup(true, [{ name: 'vite-devtools-svelte-inspector' }]))).toBe(false);
		expect(log.warn.once).not.toHaveBeenCalled();
	});
});
