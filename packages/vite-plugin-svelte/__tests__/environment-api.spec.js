import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { createServer, perEnvironmentPlugin } from 'vite';
import { svelte } from '../src/index.js';

describe('environment API', () => {
	let root;
	let server;

	afterEach(async () => {
		await server?.close();
		if (root) await fs.rm(root, { recursive: true, force: true });
	});

	it.each([
		['normally', () => svelte()],
		['through perEnvironmentPlugin', () => [perEnvironmentPlugin('svelte', () => svelte())]]
	])('initializes the plugin %s', async (_, createPlugins) => {
		root = await fs.mkdtemp(path.join(path.dirname(fileURLToPath(import.meta.url)), '../.test-'));
		await fs.writeFile(path.join(root, 'App.svelte'), '<h1>Hello</h1>');

		server = await createServer({
			root,
			configFile: false,
			logLevel: 'silent',
			server: { port: 0 },
			plugins: createPlugins()
		});
		await server.listen();

		const result = await server.environments.client.transformRequest('/App.svelte');
		expect(result?.code).toMatch(/svelte(?:_|\/)internal(?:_|\/)client/);
	});
});
