import process from 'node:process';
import { describe, it, expect } from 'vitest';
import { setupOptimizer } from '../src/plugins/setup-optimizer.js';

/** @type {import('../../types/options.d.ts').ResolvedOptions} */
const options = {
	compilerOptions: {
		dev: true,
		experimental: {
			async: true
		}
	},
	isBuild: false,
	isDebug: false,
	isProduction: false,
	isServe: true,
	root: process.cwd()
};

/**
 * @param {import('../src/types/options.js').ResolvedOptions} options
 */
function getModuleOptimizerPlugin(options) {
	const { optimizeDeps } = setupOptimizer({ options }).configEnvironment('client', {
		consumer: 'client'
	});
	// the second plugin prebundles .svelte.[jt]s modules
	const plugin = optimizeDeps.rolldownOptions.plugins[1];
	// adds the transform hook outside of the dependency scanner
	plugin.options({ plugins: [] });
	return plugin;
}

describe('setupOptimizer', () => {
	describe('module prebundling', () => {
		it('passes experimental.async to compileModule', async () => {
			const plugin = getModuleOptimizerPlugin(options);
			const result = await plugin.transform.handler(
				'const value = $derived(await Promise.resolve(1));\nexport const get = () => value;\n',
				'/node_modules/some-lib/module.svelte.js'
			);
			expect(result.code).toContain('$.async_derived');
		});
	});
});
