import fs from 'fs-extra';
import path from 'node:path';
import process from 'node:process';
import { chromium, type Browser, type Page } from 'playwright-core';
import { beforeAll, type File } from 'vitest';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

export const isBuild = !!process.env.TEST_BUILD;
export const isWin = process.platform === 'win32';
export const isCI = !!process.env.CI;

/**
 * Path to the current test file
 */
export let testPath: string;
/**
 * Path to the test folder
 */
export let testDir: string;
/**
 * Test folder name
 */
export let testName: string;

export const serverLogs: string[] = [];
export const browserLogs: string[] = [];
export const browserErrors: Error[] = [];

export let page: Page = undefined!;
export let browser: Browser = undefined!;
export let viteTestUrl: string = '';
export let e2eServer: E2EServer;

export function setViteUrl(url: string) {
	viteTestUrl = url;
}

export interface E2EServer {
	port: number;
	logs: { server?: { out: string[]; err: string[] }; build?: { out: string[]; err: string[] } };
	close: () => Promise<void>;
}

let server: E2EServer;
let tempDir: string;
let err: Error;

const logs = browserLogs;
const onConsole = (msg) => {
	logs.push(msg.text());
};

/**
 * return a unique port for serving this e2e test.
 * dev ports   3500+
 * build ports 5500+
 *
 * needed to avoid port clashes on parallel
 *
 * @param testRoot
 * @param testName
 * @param isBuild
 */
const getUniqueTestPort = async (testRoot, testName, isBuild) => {
	const testDirs = await fs.readdir(testRoot, { withFileTypes: true });
	const idx = testDirs
		.filter((f) => f.isDirectory())
		.map((d) => d.name)
		.indexOf(testName);
	if (idx < 0) {
		throw new Error(`failed to find ${testName} in ${testRoot}`);
	}
	return (isBuild ? 5500 : 3500) + idx;
};

const DIR = path.join(os.tmpdir(), 'vitest_playwright_global_setup');

beforeAll(
	async (s) => {
		const suite = s as File;
		if (!suite.filepath.includes('e2e-tests')) {
			return;
		}
		try {
			const wsEndpoint = fs.readFileSync(path.join(DIR, 'wsEndpoint'), 'utf-8');
			if (!wsEndpoint) {
				throw new Error('wsEndpoint not found');
			}

			browser = await chromium.connect(wsEndpoint);
			page = await browser.newPage();

			const testPath = suite.filepath;
			const segments = testPath.split('/');
			const testName = segments.includes('e2e-tests')
				? segments[segments.indexOf('e2e-tests') + 1]
				: null;

			// if this is a test placed under e2e-tests/xxx/__tests__
			// start a vite server in that directory.
			if (testName) {
				page.on('console', onConsole);
				const e2eTestsRoot = path.dirname(fileURLToPath(import.meta.url));

				const srcDir = path.resolve(e2eTestsRoot, testName);

				tempDir = path.resolve(e2eTestsRoot, '../../temp', isBuild ? 'build' : 'serve', testName);
				const directoriesToIgnore = [
					'node_modules',
					'__tests__',
					'dist',
					'build',
					'.svelte',
					'.svelte-kit',
					'logs'
				];
				testDir = tempDir;
				const isIgnored = (file) => {
					const segments = file.split(path.sep);
					return segments.some((segment) => directoriesToIgnore.includes(segment));
				};
				await fs.copy(srcDir, tempDir, {
					dereference: true,
					filter(file) {
						return !isIgnored(file);
					}
				});

				const e2e_tests_node_modules = path.join(srcDir, 'node_modules');
				const temp_node_modules = path.join(tempDir, 'node_modules');
				if (fs.existsSync(temp_node_modules)) {
					console.error('temp node_modules already exist', temp_node_modules);
				}
				await fs.symlink(e2e_tests_node_modules, temp_node_modules, 'dir');
				const stat = fs.lstatSync(temp_node_modules);
				if (!stat.isSymbolicLink()) {
					console.error(`failed to symlink ${e2e_tests_node_modules} to ${temp_node_modules}`);
				}
				// ensure there is no leftover vite cache
				const tempViteCache = path.join(temp_node_modules, '.vite');
				if (fs.existsSync(tempViteCache)) {
					await fs.rm(tempViteCache, { force: true, recursive: true });
				}
				const logsDir = path.join(tempDir, 'logs');
				if (fs.existsSync(logsDir)) {
					fs.rmSync(logsDir, { recursive: true, force: true });
				}
				// remove strip types flag for node < 22, it doesn't work there
				// TODO: remove once node20 is no longer part of CI
				if (Number(process.versions.node?.split('.', 1)[0]) < 22) {
					const pkgFile = path.join(tempDir, 'package.json');
					const pkgContent = fs.readFileSync(pkgFile, 'utf-8');
					const newContent = pkgContent.replaceAll(
						'cross-env NODE_OPTIONS=\\"--experimental-strip-types\\" ',
						''
					);
					fs.writeFileSync(pkgFile, newContent, 'utf-8');
				}
				await fs.mkdir(logsDir);
				const customServerScript = path.resolve(path.dirname(testPath), 'serve.js');
				const defaultServerScript = path.resolve(e2eTestsRoot, 'e2e-server.js');
				const hasCustomServer = fs.existsSync(customServerScript);
				const serverScript = hasCustomServer ? customServerScript : defaultServerScript;
				const { serve } = await import(serverScript);
				const port = await getUniqueTestPort(e2eTestsRoot, testName, isBuild);
				server = await serve(tempDir, isBuild, port);
				e2eServer = server;
				const url = (viteTestUrl = `http://localhost:${port}`);
				await (isBuild ? page.goto(url) : goToUrlAndWaitForViteWSConnect(page, url));
			}
		} catch (e) {
			console.error(`beforeAll failed for ${testName}.`, e);
			// tests are still executed so close page to shorten
			try {
				await page.close();
			} catch (e2) {
				console.error('failed to close page on error', e2);
			}
			throw e;
		}

		return async () => {
			try {
				if (page) {
					page.off('console', onConsole);
					await page.close();
				}
			} catch (e) {
				console.error('failed to close test page', e);
				if (!err) {
					err = e;
				}
			}
			try {
				await e2eServer?.close();
			} catch (e) {
				console.error('failed to close test server', e);
				if (!err) {
					err = e;
				}
			}
			if (tempDir) {
				// unlink node modules to prevent removal of linked modules on cleanup
				const temp_node_modules = path.join(tempDir, 'node_modules');
				try {
					await fs.unlink(temp_node_modules);
				} catch (e) {
					console.error(`failed to unlink ${temp_node_modules}`);
					if (!err) {
						err = e;
					}
				}
				const logDir = path.join(tempDir, 'logs');
				const logFile = path.join(logDir, 'browser.log');
				try {
					await fs.writeFile(logFile, logs.join('\n'));
				} catch (e) {
					console.error(`failed to write browserlogs in ${logFile}`, e);
					if (!err) {
						err = e;
					}
				}
			}

			if (err) {
				throw err;
			}
		};
	},
	isCI ? (isWin ? 60000 : 30000) : 20000
);

async function goToUrlAndWaitForViteWSConnect(page: Page, url: string) {
	return Promise.all([page.goto(url), waitForViteConnect(page, 15000)]);
}

export async function waitForViteConnect(page: Page, timeoutMS = 10000) {
	if (isBuild) {
		return Promise.resolve(); // no vite websocket on build
	}
	let timerId;
	let pageConsoleListener;
	const timeoutPromise = new Promise(
		(_, reject) =>
			(timerId = setTimeout(() => {
				reject(`vite client not connected after ${timeoutMS}ms. url: ${page.url()}`);
			}, timeoutMS))
	);
	const connectedPromise = new Promise<void>((resolve) => {
		pageConsoleListener = (data) => {
			const text = data.text();
			if (text.indexOf('[vite] connected.') > -1) {
				resolve();
			}
		};
		page.on('console', pageConsoleListener);
	});

	return Promise.race([connectedPromise, timeoutPromise]).finally(() => {
		page.off('console', pageConsoleListener);
		clearTimeout(timerId);
	});
}
