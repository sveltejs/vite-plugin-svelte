import * as path from 'node:path';
import * as os from 'node:os';

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const timeout = process.env.CI ? 50000 : 30000;
const __dir = path.dirname(fileURLToPath(import.meta.url));
const utilsPath = path.resolve(__dir, 'packages/e2e-tests/testUtils');

// too many threads cause vite-ssr tests to fail randomly, limit to at most 33%
const fractionOfAvailableThreads = (f: number) =>
	Math.max(1, Math.floor((os.cpus()?.length || 1) * f));
const numThreads = fractionOfAvailableThreads(1 / 3);

// start with vitest default excludes
const exclude = [
	'**/node_modules/**',
	'**/dist/**',
	'**/cypress/**',
	'**/.{idea,git,cache,output,temp}/**'
];

export default defineConfig({
	resolve: {
		alias: {
			'~utils': utilsPath
		}
	},
	test: {
		include: ['./packages/e2e-tests/**/*.spec.[tj]s'],
		exclude,
		setupFiles: ['./packages/e2e-tests/vitestSetup.ts'],
		globalSetup: ['./packages/e2e-tests/vitestGlobalSetup.ts'],
		testTimeout: timeout,
		hookTimeout: timeout,
		globals: true,
		reporters: 'dot',
		onConsoleLog(log) {
			if (log.match(/experimental|jit engine|emitted file/i)) return false;
		},
		minThreads: numThreads,
		maxThreads: numThreads
	},
	esbuild: {
		target: 'node18'
	}
});
