import { getColor, getText, browserLogs, getEl } from '~utils';
import { expect } from 'vitest';

test('should render App', async () => {
	expect(await getText('h1.foo')).toBe('Hello world');
	expect(await getColor('#app-scss')).toBe('rgb(0, 0, 153)'); // color.adjust($blue, $lightness: -20%)
	expect(await getText('#foo-title')).toBe('Styles with stylus blub');
	expect(await getColor('#foo-title')).toBe('magenta');
	expect(await getColor('p.note')).toBe('rgb(255, 62, 0)');
	expect(await getText('#enum')).toBe('qoox');
});

test('should not mangle code from esbuild pure annotations', async () => {
	expect(browserLogs.some((log) => log.startsWith('pure test 1'))).toBe(true);
	expect(browserLogs.some((log) => log.startsWith('pure test 2'))).toBe(true);
});

test('should apply transforms from preprocessors in the right order', async () => {
	const ol = await getEl('#transforms-list');
	expect(ol).toBeDefined();
	const items = await ol.$$('li');
	const texts = await Promise.all(items.map((l) => l.textContent()));
	expect(texts[0]).toBe(
		'before svelte preprocessors: vite-plugin (enforce: pre) transform (order: pre)'
	);
	expect(texts[1]).toBe('vite-plugin-svelte:preprocess: preprocessor from config');
	expect(texts[2]).toBe('after svelte preprocessors: vite-plugin (default) transform (default)');
	expect(texts[3]).toBe('after svelte compile: vite-plugin (default) transform (order: post)');
	expect(texts.length).toBe(4);
});
