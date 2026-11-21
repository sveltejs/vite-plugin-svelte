import process from 'node:process';
import { describe, it, expect } from 'vitest';
import { setupOptimizer } from '../src/plugins/setup-optimizer.js';

/** @type {import('../../types/options.d.ts').ResolvedOptions} */
const baseOptions = {
	compilerOptions: {
		dev: true
	},
	isBuild: false,
	isDebug: false,
	isProduction: false,
	isServe: true,
	root: process.cwd()
};

/**
 * minimal markup preprocessor, enough to prove preprocessing ran
 */
const replaceMessagePreprocessor = {
	name: 'test-replace-message',
	markup: ({ content }) => ({ code: content.replace(/__MESSAGE__/g, '"hello"') })
};

/**
 * @param {import('../src/types/options.js').ResolvedOptions} options
 */
function getModuleOptimizerPlugin(options) {
	const { optimizeDeps } = setupOptimizer({ options }).configEnvironment('client', {
		consumer: 'client'
	});
	// plugins[0] prebundles components, plugins[1] prebundles .svelte.[jt]s modules
	const modulePlugin = optimizeDeps.rolldownOptions.plugins[1];
	// attaches transform/buildStart hooks outside of the dep-scan context
	modulePlugin.options({ plugins: [] });
	return modulePlugin;
}

describe('setupOptimizer', () => {
	describe('module prebundling', () => {
		it('preprocesses .svelte.ts modules before compileModule', async () => {
			const modulePlugin = getModuleOptimizerPlugin({
				...baseOptions,
				preprocess: [replaceMessagePreprocessor]
			});
			const result = await modulePlugin.transform.handler(
				'export const message = __MESSAGE__;\n',
				'/some/dep/module.svelte.ts'
			);
			expect(result.code).toContain('hello');
			expect(result.code).not.toContain('__MESSAGE__');
		});

		it('strips typescript from .svelte.ts modules before compileModule', async () => {
			const modulePlugin = getModuleOptimizerPlugin({ ...baseOptions });
			const result = await modulePlugin.transform.handler(
				'export interface Ctx { width: number }\n' +
					'export const message: string = "hello";\n' +
					'export function plan(ctx: Ctx): string {\n' +
					'\treturn ctx.width > 0 ? message : "empty";\n' +
					'}\n',
				'/some/dep/module.svelte.ts'
			);
			expect(result.code).toContain('hello');
			expect(result.code).not.toContain(': string');
			expect(result.code).not.toContain('interface Ctx');
		});

		it('compiles .svelte.js modules when no preprocess options are set', async () => {
			const modulePlugin = getModuleOptimizerPlugin({ ...baseOptions });
			const result = await modulePlugin.transform.handler(
				'export const message = "hello";\n',
				'/some/dep/module.svelte.js'
			);
			expect(result.code).toContain('hello');
		});
	});
});
