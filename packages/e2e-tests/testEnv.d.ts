import { Page } from 'playwright-core';
import { E2EServer } from '../../scripts/jestPerTestSetup';

declare global {
	// injected by the custom jest env in scripts/jestEnv.js
	const page: Page;

	// injected in scripts/jestPerTestSetup.ts
	const browserLogs: string[];
	const viteTestUrl: string;
	const e2eServer: E2EServer;
}
