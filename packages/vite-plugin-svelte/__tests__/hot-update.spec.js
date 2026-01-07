import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, createServerModuleRunner } from 'vite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { svelte } from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(__dirname, 'fixtures', 'temp', 'hmr');

/**
 * @param {import('vite').ViteDevServer} server
 * @returns {Promise<void>}
 *
 * Based on https://github.com/vitejs/vite/blob/10b24952cf0121410c45537931b609de60ae0471/packages/vite/src/node/ssr/runtime/__tests__/utils.ts#L24
 */
function waitForWatcher(server) {
	return new Promise((resolve) => {
		if (server.watcher._readyEmitted) {
			resolve();
		} else {
			server.watcher.once('ready', () => resolve());
		}
	});
}

/**
 * @typedef {(input: import('vite').HotUpdateOptions) => import('vite').HotUpdateOptions} HandleInput
 * @typedef {(output: Array<import('vite').EnvironmentModuleNode> | void) => Array<import('vite').EnvironmentModuleNode> | void} HandleOutput
 */

/**
 * Based on https://github.com/vitejs/vite/blob/10b24952cf0121410c45537931b609de60ae0471/packages/vite/src/node/ssr/runtime/__tests__/utils.ts#L20
 *
 * @param {{handleInput?: HandleInput, handleOutput?: HandleOutput}} options
 */
async function createModuleRunnerTester({ handleInput, handleOutput } = {}) {
	const server = await createServer({
		root: fixtureDir,
		server: {
			middlewareMode: true,
			watch: {},
			hmr: true
		},
		ssr: {
			external: []
		},
		optimizeDeps: {
			noDiscovery: true,
			include: []
		},

		plugins: [
			svelte().map((plugin) => {
				if (plugin.name !== 'vite-plugin-svelte:hot-update') {
					return plugin;
				}
				const original = plugin.hotUpdate.handler;
				return {
					...plugin,
					hotUpdate: {
						...plugin.hotUpdate,
						async handler(ctx) {
							const nextCtx = handleInput ? handleInput(ctx) : ctx;
							const result = await Reflect.apply(original, this, [nextCtx]);
							return handleOutput ? handleOutput(result) : result;
						}
					}
				};
			})
		]
	});

	const environment = server.environments.ssr;
	const runner = createServerModuleRunner(environment, {
		hmr: {
			logger: false
		},
		// don't override by default so Vitest source maps are correct
		sourcemapInterceptor: false
	});

	await waitForWatcher(server);

	const tearDown = async () => {
		await server.close();
		await environment.close();
		await runner.close();
	};
	return { server, runner, environment, tearDown };
}

const initialCode = `<script>let js_variable = "JS_VARIABLE_1";</script>

<span class="apple">{js_variable}</span>

<style>
	:root {
		--css_variable: 'CSS_VARIABLE_1';
	}
	.apple:before {
		content: var(--css_variable);
	}
</style>
`;

describe('hmr', () => {
	const svelteRelativePath = 'apple.svelte';
	const styleRelativePath = svelteRelativePath + '?svelte&type=style&lang.css';
	const svelteAbsolutePath = path.resolve(fixtureDir, svelteRelativePath);
	const styleAbsolutePath = path.resolve(fixtureDir, styleRelativePath);

	beforeEach(async () => {
		fs.mkdirSync(fixtureDir, { recursive: true });
		fs.writeFileSync(svelteAbsolutePath, initialCode);
	});

	afterEach(async () => {
		fs.rmSync(svelteAbsolutePath);
	});

	it('can trigger hmr when the JS and CSS code changes', async () => {
		let code = initialCode;

		const outputModuleIds = [];

		/** @type {HandleOutput} */
		const handleOutput = (out) => {
			if (out) {
				for (const m of out) {
					outputModuleIds.push(m.id);
				}
			}
		};

		const { server, tearDown } = await createModuleRunnerTester({
			handleOutput
		});

		// Initialize the modules
		await server.environments.client.transformRequest(svelteRelativePath);

		// Clear the output
		outputModuleIds.length = 0;

		// It should able to trigger hmr when the JS code changes
		expect(outputModuleIds).toHaveLength(0);
		code = code.replace(/JS_VARIABLE_\d+/, `JS_VARIABLE_${Date.now()}`);
		fs.writeFileSync(svelteAbsolutePath, code);
		server.watcher.emit('change', svelteAbsolutePath);
		await expect.poll(() => outputModuleIds).toContain(svelteAbsolutePath);

		// Clear the output
		outputModuleIds.length = 0;

		// It should able to trigger hmr when the CSS code changes
		code = code.replace(/CSS_VARIABLE_\d+/, `CSS_VARIABLE_${Date.now()}`);
		fs.writeFileSync(svelteAbsolutePath, code);
		server.watcher.emit('change', svelteAbsolutePath);
		await expect.poll(() => outputModuleIds).toContain(styleAbsolutePath);

		await tearDown();
	});

	it('can trigger hmr when JS module is not defined', async () => {
		let code = initialCode;

		const outputModuleIds = [];

		/** @type {HandleOutput} */
		const handleOutput = (out) => {
			if (out) {
				for (const m of out) {
					outputModuleIds.push(m.id);
				}
			}
		};

		/** @type {HandleInput} */
		const handleInput = (ctx) => {
			if (ctx.modules.length === 0) {
				return ctx;
			}
			expect(ctx.modules.length).toBe(2);
			const jsModule = ctx.modules.find((m) => m.id === svelteAbsolutePath);
			const styleModule = ctx.modules.find((m) => m.id === styleAbsolutePath);
			expect(jsModule).toBeTruthy();
			expect(styleModule).toBeTruthy();

			// When using Astro to render Svelte components on the server (without client side hydration), the `modules` array will only contain the Styles module.
			return { ...ctx, modules: [styleModule] };
		};

		const { server, tearDown } = await createModuleRunnerTester({
			handleInput,
			handleOutput
		});

		// Initialize the modules
		await server.environments.client.transformRequest(svelteRelativePath);

		// Clear the output
		outputModuleIds.length = 0;

		// It should able to trigger hmr when the CSS code changes
		code = code.replace(/CSS_VARIABLE_\d+/, `CSS_VARIABLE_${Date.now()}`);
		fs.writeFileSync(svelteAbsolutePath, code);
		server.watcher.emit('change', svelteAbsolutePath);
		await expect.poll(() => outputModuleIds).toContain(styleAbsolutePath);

		await tearDown();
	});
});
