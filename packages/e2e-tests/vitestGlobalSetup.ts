import os from 'node:os';
import fs from 'fs-extra';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { execa } from 'execa';
import { fileURLToPath } from 'node:url';

const tempTestDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'temp');

const isBuildTest = !!process.env.TEST_BUILD;
const isCI = !!process.env.CI;
const showTestBrowser = !!process.env.TEST_SHOW_BROWSER;
const preserveArtifacts = !!process.env.TEST_PRESERVE_ARTIFACTS || isCI;

const DIR = path.join(os.tmpdir(), 'vitest_playwright_global_setup');

const syncNodeModules = async () => {
	// tests use symbolic linked node_modules directories. make sure the workspace is up for it
	console.log('syncing node_modules');
	await execa('pnpm', ['install', '--frozen-lockfile', '--prefer-offline', '--silent'], {
		stdio: 'inherit'
	});
	console.log('syncing node_modules done');
};

const startPlaywrightServer = async () => {
	const headless = !showTestBrowser;
	const args = [];
	if (isCI) {
		args.push('--no-sandbox', '--disable-setuid-sandbox');
	}
	if (headless) {
		args.push('--headless');
	}
	return chromium.launchServer({
		headless,
		args
	});
};

export async function setup() {
	if (!isCI) {
		// TODO currently this builds twice when running yarn test
		console.log('');
		console.log('preparing non ci env...');
		await syncNodeModules();
		console.log('preparations done');
	}
	console.log('Starting playwright server ...');
	const browserServer = await startPlaywrightServer();
	console.log('Playwright server running');
	console.log('storing wsEndpoint in ' + DIR);
	await fs.mkdirp(DIR);
	await fs.writeFile(path.join(DIR, 'wsEndpoint'), browserServer.wsEndpoint());
	console.log('clearing previous test artifacts');
	if (!preserveArtifacts) {
		await fs.remove(tempTestDir);
	} else {
		await fs.remove(path.join(tempTestDir, isBuildTest ? 'build' : 'serve'));
	}
	console.log('vitest global setup done');
	return async () => {
		if (!preserveArtifacts) {
			try {
				await fs.remove(tempTestDir);
			} catch (e) {
				console.error('failed to clear ' + tempTestDir, e);
			}
		}
		try {
			await browserServer?.close();
		} catch (e) {
			console.error('failed to close browserServer', e);
		}
	};
}
