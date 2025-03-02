import { browserLogs, findAssetFile, getColor, getEl, getText, isBuild } from '~utils';
import { expect } from 'vitest';

test('should not have failed requests', async () => {
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
});

test('should apply css from used components', async () => {
	expect(await getText('#app')).toBe('App');
	expect(await getColor('#app')).toBe('blue');
	expect(await getText('#a')).toBe('A');
	expect(await getColor('#a')).toBe('red');
});

test('should apply css from unused components that contain global styles', async () => {
	expect(await getEl('head style[src]'));
	expect(await getColor('#test')).toBe('green'); // from B.svelte
});

test('should not render unused components', async () => {
	expect(await getEl('#b')).toBeNull();
	expect(await getEl('#c')).toBeNull();
});

if (isBuild) {
	test('should include unscoped global styles from unused components', async () => {
		const cssOutput = findAssetFile(/index-.*\.css/);
		expect(cssOutput).toContain('#test{color:green}'); // from B.svelte
	});
	test('should not include scoped styles from unused components', async () => {
		const cssOutput = findAssetFile(/index-.*\.css/);
		// from C.svelte
		expect(cssOutput).not.toContain('.unused');
	});
}
