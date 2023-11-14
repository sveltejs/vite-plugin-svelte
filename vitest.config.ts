import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['./packages/**/__tests__/**/*.spec.[tj]s'],
		exclude: ['**/node_modules/**', '**/dist/**', './packages/e2e-tests/**/*.*', './temp/**/*.*'],
		watchExclude: [
			'**/node_modules/**',
			'**/dist/**',
			'./packages/e2e-tests/**/*.*',
			'./temp/**/*.*'
		],
		testTimeout: 20000,
		reporters: 'dot',
		maxThreads: process.env.CI ? 1 : undefined,
		minThreads: process.env.CI ? 1 : undefined
	},
	esbuild: {
		target: 'node18'
	}
});
