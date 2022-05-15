import * as path from 'path';
import * as os from 'os';
// eslint-disable-next-line node/no-missing-import
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
const timeout = process.env.CI ? 50000 : 30000;
// @ts-ignore
const __dir = path.dirname(fileURLToPath(import.meta.url));
const utilsPath = path.resolve(__dir, 'packages/e2e-tests/testUtils');
export const isBuild = !!process.env.TEST_BUILD;

//too many threads cause vite-ssr tests to fail randomly, limit to at most 33%
const fractionOfAvailableThreads = (f) => Math.max(1, Math.floor((os.cpus()?.length || 1) * f));
const num_threads = fractionOfAvailableThreads(1 / 3);

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
		minThreads: num_threads,
		maxThreads: num_threads
	},
	esbuild: {
		target: 'node14'
	}
});
