const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const { chromium } = require('playwright-core');
const execa = require('execa');

const isBuildTest = !!process.env.VITE_TEST_BUILD;
const isCI = !!process.env.CI;
const showTestBrowser = !!process.env.TEST_SHOW_BROWSER;

const DIR = path.join(os.tmpdir(), 'jest_playwright_global_setup');

const buildPackagesUnderTest = async () => {
	console.log('building packages');
	await execa('pnpm', ['build:ci'], { stdio: 'inherit' });
	console.log('building packages done');
};

const syncNodeModules = async () => {
	// tests use symbolic linked node_modules directories. make sure the workspace is up for it
	console.log('syncing node_modules');
	await execa(
		'pnpm',
		['install', '--prefer-frozen-lockfile', '--prefer-offline', '--no-lockfile', '--silent'],
		{ stdio: 'inherit' }
	);
	console.log('syncing node_modules done');
};

const startPlaywrightServer = async () => {
	const headless = !showTestBrowser;
	const args = ['--disable-gpu', '--single-process', '--no-zygote', '--no-sandbox'];
	if (isCI) {
		args.push('--disable-setuid-sandbox', '--disable-dev-shm-usage');
	}
	if (headless) {
		args.push('--headless');
	}
	return chromium.launchServer({
		channel: 'chrome',
		headless,
		args
	});
};

module.exports = async () => {
	if (!isCI) {
		// TODO currently this builds twice when running yarn test
		console.log('');
		console.log('preparing non ci env...');
		await syncNodeModules();
		await buildPackagesUnderTest();
		console.log('preparations done');
	}
	console.log('Starting playwright server ...');
	const browserServer = await startPlaywrightServer();
	console.log('Playwright server running');
	global.__BROWSER_SERVER__ = browserServer;
	console.log('storing wsEndpoint in ' + DIR);
	await fs.mkdirp(DIR);
	await fs.writeFile(path.join(DIR, 'wsEndpoint'), browserServer.wsEndpoint());
	console.log('clearing previous test artifacts');
	if (!process.env.VITE_PRESERVE_BUILD_ARTIFACTS) {
		await fs.remove(path.resolve(__dirname, '..', 'temp'));
	} else {
		await fs.remove(path.resolve(__dirname, '..', 'temp', isBuildTest ? 'build' : 'serve'));
	}
	console.log('jest global setup done');
};
