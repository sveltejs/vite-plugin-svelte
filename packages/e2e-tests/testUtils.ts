// test utils used in e2e tests
// this can be directly imported in any e2e tests as 'testUtils', e.g.
// `import { getColor } from 'testUtils'`
import fs from 'node:fs';
import path from 'node:path';
import colors from 'css-color-names';
import { ElementHandle } from 'playwright-core';
import fetch from 'node-fetch';
import { VERSION } from 'svelte/compiler';
import {
	isBuild,
	isWin,
	isCI,
	page,
	testDir,
	browserLogs,
	e2eServer,
	waitForViteConnect
} from './vitestSetup.js';

export * from './vitestSetup.js';

export const hmrUpdateTimeout = 10000;

export const isSvelte4 = VERSION.startsWith('4.');

const hexToNameMap: Record<string, string> = {};
Object.keys(colors).forEach((color) => {
	hexToNameMap[colors[color]] = color;
});

function componentToHex(c: number): string {
	const hex = c.toString(16);
	return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex(rgb: string): string {
	const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
	if (match) {
		const [_, rs, gs, bs] = match;
		return (
			'#' +
			componentToHex(parseInt(rs, 10)) +
			componentToHex(parseInt(gs, 10)) +
			componentToHex(parseInt(bs, 10))
		);
	} else {
		return '#000000';
	}
}

const timeout = (n: number) => new Promise((r) => setTimeout(r, n));

async function toEl(el: string | ElementHandle): Promise<ElementHandle> {
	if (typeof el === 'string') {
		return await page.$(el, { strict: true });
	}
	return el;
}

export async function getColor(el: string | ElementHandle) {
	el = await toEl(el);
	if (el == null) {
		return null;
	}
	const rgb = await el.evaluate((el) => getComputedStyle(el as Element).color);
	return hexToNameMap[rgbToHex(rgb)] || rgb;
}

export async function getBg(el: string | ElementHandle) {
	el = await toEl(el);
	return el == null ? null : el.evaluate((el) => getComputedStyle(el as Element).backgroundImage);
}

export function readFileContent(filename: string) {
	filename = path.resolve(testDir, filename);
	return fs.readFileSync(filename, 'utf-8');
}

export function editFile(filename: string, replacer: (str: string) => string) {
	if (isBuild) return;
	filename = path.resolve(testDir, filename);
	const content = fs.readFileSync(filename, 'utf-8');
	const modified = replacer(content);
	fs.writeFileSync(filename, modified);
	return modified;
}

export function addFile(filename: string, content: string) {
	fs.writeFileSync(path.resolve(testDir, filename), content);
}

export function removeFile(filename: string) {
	fs.unlinkSync(path.resolve(testDir, filename));
}

export function findAssetFile(match: string | RegExp, base = '') {
	const assetsDir = path.join(testDir, 'dist', base, 'assets');
	const files = fs.readdirSync(assetsDir);
	const file = files.find((file) => {
		return file.match(match);
	});
	return file ? fs.readFileSync(path.resolve(assetsDir, file), 'utf-8') : '';
}

/**
 * Poll a getter until the value it returns includes the expected value.
 */
export async function untilMatches(
	getValue: () => string | Promise<string>,
	matches: string,
	msg: string
) {
	if (isBuild) return;

	const maxTries = process.env.CI ? 100 : 20;
	for (let tries = 0; tries < maxTries; tries++) {
		const current = await getValue();
		if (current != null && typeof current !== 'string') {
			throw new Error('getValue must return a string, received: ' + typeof current);
		}
		if (current?.includes(matches) || tries === maxTries - 1) {
			expect(current, msg).toMatch(matches);
			break;
		} else {
			await timeout(50);
		}
	}
}

export async function sleep(n: number) {
	return timeout(n);
}

export async function getEl(selector: string) {
	return toEl(selector);
}

export async function getText(el: string | ElementHandle) {
	el = await toEl(el);
	return el ? el.textContent() : null;
}

export async function hmrUpdateComplete(file, timeout) {
	let id;
	let pageConsoleListener;
	const timerPromise = new Promise(
		(_, reject) =>
			(id = setTimeout(() => {
				reject(`timeout for ${file} after ${timeout}`);
			}, timeout))
	);
	const pagePromise = new Promise((resolve) => {
		pageConsoleListener = (data) => {
			const text = data.text();
			if (text.indexOf(file) > -1) {
				resolve(file);
			}
		};
		page.on('console', pageConsoleListener);
	});

	return Promise.race([timerPromise, pagePromise]).finally(() => {
		page.off('console', pageConsoleListener);
		clearTimeout(id);
	});
}

export async function editFileAndWaitForHmrComplete(file, replacer, fileUpdateToWaitFor?) {
	const newContent = editFile(file, replacer);
	if (!fileUpdateToWaitFor) {
		fileUpdateToWaitFor = file;
	}
	try {
		await hmrUpdateComplete(fileUpdateToWaitFor, hmrUpdateTimeout);
	} catch (e) {
		const maxTries = isCI && isWin ? 3 : 1;
		let lastErr;
		for (let i = 1; i <= maxTries; i++) {
			try {
				console.log(`retry #${i} of hmr update for ${file}`);
				editFile(file, () => newContent + '\n'.repeat(i));
				await hmrUpdateComplete(fileUpdateToWaitFor, hmrUpdateTimeout);
				return;
			} catch (e) {
				lastErr = e;
			}
		}
		await saveScreenshot(`failed_update_${file}`);
		throw lastErr;
	}
}

export function hmrCount(file) {
	return browserLogs.filter((line) => line.includes('hot updated') && line.includes(file)).length;
}

export async function saveScreenshot(name: string) {
	if (!page) {
		return;
	}
	const filename = `${new Date().toISOString().replace(/\D/g, '')}_${name
		.toLowerCase()
		.replace(/[^a-z]/g, '_')}.jpeg`;
	const fullpath = path.resolve(testDir, 'screenshots', filename);
	try {
		await page.screenshot({
			fullPage: true,
			type: 'jpeg',
			quality: 70,
			timeout: 2000,
			path: fullpath
		});
	} catch (e) {
		console.log('failed to take screenshot', e);
	}
}

export async function editViteConfig(replacer: (str: string) => string) {
	editFile('vite.config.js', replacer);
	if (!isBuild) {
		await waitForServerRestartAndPageReload();
	}
}

export async function waitForServerRestartAndPageReload(timeout = 10000) {
	const logs = e2eServer.logs.server.out;
	const startIdx = logs.length;
	let timeleft = timeout;
	const pollInterval = 50;
	let restarted = false;
	while (timeleft > 0) {
		await sleep(pollInterval);
		if (logs.some((text, i) => i > startIdx && text.endsWith('server restarted.'))) {
			restarted = true;
			break;
		}
		timeleft -= pollInterval;
	}
	if (!restarted) {
		throw new Error(`server did not restart after ${timeout}ms`);
	}
	// wait for vite auto-refresh and connect
	await waitForViteConnect(page);
	// wait for page to completely load
	await page.waitForLoadState();
}

export async function reloadPage() {
	await Promise.all([page.reload(), waitForViteConnect(page)]);
}

export async function waitForNavigation(opts: Parameters<typeof page.waitForNavigation>[0]) {
	const timeout = opts.timeout || 30000; // default playwright timeout is 30000
	let timeoutHandle: NodeJS.Timeout;
	const timeoutPromise = new Promise((resolve, reject) => {
		timeoutHandle = setTimeout(
			() => reject(new Error(`navigation timed out after ${timeout}ms`)),
			timeout - 50 // have slightly shorter timeout so error is shown before playwright timeout
		);
	});
	await Promise.race([page.waitForNavigation(opts), timeoutPromise]).finally(() => {
		clearTimeout(timeoutHandle);
	});
}

export async function fetchPageText() {
	const url = page.url();
	const res = await fetch(url);
	if (res.ok) {
		return res.text();
	} else {
		throw new Error(`request to ${url} failed with ${res.status} - ${res.statusText}.`);
	}
}

export async function fetchFromPage(url, init?) {
	const fullUrl = page.url() + (url.startsWith('/') ? url.slice(1) : url);
	return fetch(fullUrl, init);
}
export function readVitePrebundleMetadata() {
	const metadataPaths = [
		'node_modules/.vite/_metadata.json',
		'node_modules/.vite/deps/_metadata.json' // vite 2.9
	];
	for (const metadataPath of metadataPaths) {
		try {
			const vitePrebundleMetadata = path.resolve(testDir, metadataPath);
			const metadataFile = fs.readFileSync(vitePrebundleMetadata, 'utf8');
			return metadataFile;
		} catch {
			// ignore
		}
	}
	throw new Error('Unable to find vite prebundle metadata');
}
