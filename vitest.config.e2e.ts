import * as path from 'path';
import * as fs from 'fs';
// eslint-disable-next-line node/no-missing-import
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

const timeout = process.env.CI ? 50000 : 30000;
// @ts-ignore
const __dir = path.dirname(fileURLToPath(import.meta.url));
const utilsPath = path.resolve(__dir, 'packages/e2e-tests/testUtils');
export const isBuild = !!process.env.TEST_BUILD;
const reportsPath = path.resolve(
	__dir,
	'test-reports',
	'junit',
	isBuild ? 'build.xml' : 'serve.xml'
);
fs.mkdirSync(path.dirname(reportsPath), { recursive: true });
export default defineConfig({
	resolve: {
		alias: {
			'~utils': utilsPath
		}
	},
	test: {
		include: ['./packages/e2e-tests/**/*.spec.[tj]s'],
		setupFiles: ['./packages/e2e-tests/vitestSetup.ts'],
		globalSetup: ['./packages/e2e-tests/vitestGlobalSetup.ts'],
		testTimeout: timeout,
		hookTimeout: timeout,
		globals: true,
		reporters: 'dot',
		onConsoleLog(log) {
			if (log.match(/experimental|jit engine|emitted file/i)) return false;
		},
		// use 1 thread max on CI to avoid flakiness
		maxThreads: process.env.CI ? 1 : undefined,
		minThreads: process.env.CI ? 1 : undefined
	},
	esbuild: {
		target: 'node14'
	}
});
