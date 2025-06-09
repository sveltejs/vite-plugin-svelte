import { getColor, getText, browserLogs } from '~utils';
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
