import { Page } from 'playwright-core';

declare global {
	// injected by the custom jest env in scripts/jestEnv.js
	const page: Page;

	// injected in scripts/jestPerTestSetup.ts
	const browserLogs: string[];
	const viteTestUrl: string;
}
