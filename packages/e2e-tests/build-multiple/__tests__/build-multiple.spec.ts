import { fileURLToPath } from 'node:url';
import { build, type Rollup, type InlineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { isBuild } from '~utils';

test.runIf(isBuild)('build-multiple', async () => {
	const sharedConfig: InlineConfig = {
		configFile: false,
		root: fileURLToPath(new URL('../', import.meta.url)),
		build: {
			write: false
		},
		logLevel: 'silent',
		plugins: [svelte()]
	};

	// Ensure two builds work as expected and have no build errors

	const output1 = await build({ ...sharedConfig, mode: 'production' });
	expect(output1).toHaveProperty('output');
	expect(
		(output1 as Rollup.RollupOutput).output.find(
			(c) => c.type === 'chunk' && c.code.includes('mode: production')
		)
	).toBeDefined();

	const output2 = await build({ ...sharedConfig, mode: 'staging' });
	expect(output2).toHaveProperty('output');
	expect(
		(output2 as Rollup.RollupOutput).output.find(
			(c) => c.type === 'chunk' && c.code.includes('mode: staging')
		)
	).toBeDefined();
});
