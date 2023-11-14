import { browserLogs, getColor, getText, isBuild, isSvelte4 } from '~utils';
import { expect } from 'vitest';

test('should not have failed requests', async () => {
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
});

test('should apply css compiled from scss', async () => {
	expect(await getText('#test')).toBe('red');
	expect(await getColor('#test')).toBe('red');
	expect(await getText('.foo')).toBe('magenta');
	expect(await getColor('.foo')).toBe('magenta');
});

if (!isBuild) {
	test('should generate sourcemap', async () => {
		const style = await getText('style[data-vite-dev-id*="App.svelte"]');
		const lines = style.split('\n').map((l) => l.trim());
		const css = lines[0];
		const mapComment = lines[lines.length - 1];
		if (isSvelte4) {
			expect(css).toBe(
				'.foo.s-XsEmFtvddWTw{color:magenta}#test.s-XsEmFtvddWTw{color:red}.s-XsEmFtvddWTw{}'
			);
		} else {
			// TODO svelte 5 returns style multiline and doesn't set the right css hash class
			// figure out a better way to expect here
			expect(style).toMatch('color: magenta');
			expect(style).toMatch('color: red');
		}
		const b64start = '/*# sourceMappingURL=data:application/json;base64,';
		const b64end = ' */';
		expect(mapComment.startsWith(b64start));
		expect(mapComment.endsWith(b64end));
		const map = JSON.parse(
			Buffer.from(mapComment.slice(b64start.length, -1 * b64end.length), 'base64').toString('utf-8')
		);
		expect(map.sources).toStrictEqual(['foo.scss', 'App.svelte']);
		expect(map.file).toBe('App.svelte');
		// we are not testing the quality of the mapping here, just that it exists.
		expect(map.mappings).toBeDefined();
	});
}
