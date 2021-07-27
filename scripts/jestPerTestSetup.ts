import * as fs from 'fs-extra';
import * as path from 'path';
import { Page } from 'playwright-core';

const isBuild = !!process.env.VITE_TEST_BUILD;

function testDir() {
	const testPath = expect.getState().testPath;
	const segments = testPath.split(path.sep);
	const testName = segments[segments.indexOf('e2e-tests') + 1];
	return path.resolve(__dirname, '../temp', isBuild ? 'build' : 'serve', testName);
}

// injected by the test env
declare global {
	// eslint-disable-next-line no-unused-vars
	namespace NodeJS {
		// eslint-disable-next-line no-unused-vars
		interface Global {
			page?: Page;
			viteTestUrl?: string;
		}
	}
}

interface E2EServer {
	port: number;
	logs: { server?: { out: string[]; err: string[] }; build?: { out: string[]; err: string[] } };
	close: () => {};
}

let server: E2EServer;
let tempDir: string;
let err: Error;

const logs = ((global as any).browserLogs = []);
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

beforeAll(async () => {
	const page = (global as any).page;
	if (!page) {
		return;
	}
	const testPath = expect.getState().testPath;
	const segments = testPath.split(path.sep);
	const testName = segments.includes('e2e-tests')
		? segments[segments.indexOf('e2e-tests') + 1]
		: null;
	try {
		// if this is a test placed under e2e-tests/xxx/__tests__
		// start a vite server in that directory.
		if (testName) {
			page.on('console', onConsole);
			const e2eTestsRoot = path.resolve(__dirname, '../packages/e2e-tests');
			const srcDir = path.resolve(e2eTestsRoot, testName);

			tempDir = path.resolve(__dirname, '../temp', isBuild ? 'build' : 'serve', testName);
			const directoriesToIgnore = [
				'node_modules',
				'__tests__',
				'dist',
				'build',
				'.svelte',
				'.svelte-kit'
			];
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
			await fs.mkdir(path.join(tempDir, 'logs'));
			const customServerScript = path.resolve(path.dirname(testPath), 'serve.js');
			const defaultServerScript = path.resolve(e2eTestsRoot, 'e2e-server.js');
			const hasCustomServer = fs.existsSync(customServerScript);
			const { serve } = require(hasCustomServer ? customServerScript : defaultServerScript);
			const port = await getUniqueTestPort(e2eTestsRoot, testName, isBuild);
			server = await serve(tempDir, isBuild, port);
			const url = ((global as any).viteTestUrl = `http://localhost:${port}`);
			await (isBuild ? page.goto(url) : goToUrlAndWaitForViteWSConnect(page, url));
		}
	} catch (e) {
		// jest doesn't exit if our setup has error here
		// https://github.com/facebook/jest/issues/2713
		err = e;
		console.error(`beforeAll failed for ${testName}.`, e);
		// tests are still executed so close page to shorten
		try {
			await page.close();
		} catch (e2) {
			console.error('failed to close page on error', e2);
		}
	}
}, 30000);

afterAll(async () => {
	try {
		const page = (global as any).page;
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
		await server?.close();
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
		const logDir = path.join(testDir(), 'logs');
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
});

async function goToUrlAndWaitForViteWSConnect(page: Page, url: string) {
	let timerId;
	let pageConsoleListener;
	const timeoutMS = 10000;
	const timeoutPromise = new Promise(
		// eslint-disable-next-line no-unused-vars
		(_, reject) =>
			(timerId = setTimeout(() => {
				reject(`page under test not ready after ${timeoutMS}ms. url: ${url}`);
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

	const connectedOrTimeout = Promise.race([connectedPromise, timeoutPromise]).finally(() => {
		page.off('console', pageConsoleListener);
		clearTimeout(timerId);
	});
	return page.goto(url).then(() => connectedOrTimeout);
}
