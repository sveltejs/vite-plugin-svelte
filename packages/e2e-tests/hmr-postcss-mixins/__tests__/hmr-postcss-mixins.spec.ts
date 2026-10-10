import { isBuild, getText, getColor, editFile, browserLogs } from '~utils';

test('should render App', async () => {
	expect(await getText('#label')).toBe('postcss mixin case');
	expect(await getColor('#label')).toBe('blue');
});

test('should not have failed requests', async () => {
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
});

if (!isBuild) {
	describe('hmr', () => {
		test('should apply updates when editing mixins.pcss, a dependency injected via @csstools/postcss-global-data', async () => {
			expect(await getColor('#label')).toBe('blue');
			editFile('src/mixins.pcss', (c) => c.replace('color: blue', 'color: magenta'));
			// a single edit here can result in more than one HMR message reaching the browser (one for the style
			// module, one a full component reload), so poll for the settled result rather than waiting for just the
			// first message and asserting immediately
			await expect.poll(() => getColor('#label')).toBe('magenta');
		});
	});
}
