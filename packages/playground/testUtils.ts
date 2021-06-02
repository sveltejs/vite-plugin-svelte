// test utils used in e2e tests for playgrounds.
// this can be directly imported in any playground tests as 'testUtils', e.g.
// `import { getColor } from 'testUtils'`
import fs from 'fs';
import path from 'path';
import colors from 'css-color-names';
import { ElementHandle } from 'playwright-core';

export const isBuild = !!process.env.VITE_TEST_BUILD;
export const isWin = process.platform === 'win32';
export const isCI = !!process.env.CI;

export const hmrUpdateTimeout = isCI && isWin ? 20000 : 10000;

const testPath = expect.getState().testPath;
const segments = testPath.split(path.sep);
const testName = segments[segments.indexOf('playground') + 1];
export const testDir = path.resolve(__dirname, '../../temp', isBuild ? 'build' : 'serve', testName);

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
		return await page.$(el);
	}
	return el;
}

export async function getColor(el: string | ElementHandle) {
	el = await toEl(el);
	const rgb = await el.evaluate((el) => getComputedStyle(el as Element).color);
	return hexToNameMap[rgbToHex(rgb)] || rgb;
}

export async function getBg(el: string | ElementHandle) {
	el = await toEl(el);
	return el.evaluate((el) => getComputedStyle(el as Element).backgroundImage);
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
export async function untilUpdated(poll: () => string | Promise<string>, expected: string) {
	if (isBuild) return;
	const maxTries = process.env.CI ? 100 : 20;
	for (let tries = 0; tries < maxTries; tries++) {
		const actual = (await poll()) || '';
		if (actual.indexOf(expected) > -1 || tries === maxTries - 1) {
			expect(actual).toMatch(expected);
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
	return el ? await el.evaluate((el) => el.textContent) : null;
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
	const newContent = await editFile(file, replacer);
	if (!fileUpdateToWaitFor) {
		fileUpdateToWaitFor = file;
	}
	try {
		await hmrUpdateComplete(fileUpdateToWaitFor, hmrUpdateTimeout);
	} catch (e) {
		console.log(`retrying hmr update for ${file}`);
		await editFile(file, () => newContent);
		await hmrUpdateComplete(fileUpdateToWaitFor, hmrUpdateTimeout);
	}
}
