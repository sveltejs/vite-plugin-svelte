import { browserLogs, findAssetFile, getColor, getText, isBuild } from '~utils';

test('should not have failed requests', async () => {
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
});

test('should render Gold', async () => {
	expect(await getText('h1')).toBe('Gold');
	expect(await getColor('h1')).toBe('gold');
});

if (isBuild) {
	test('should omit magenta', async () => {
		const css = await findAssetFile(/index.*\.css/);
		expect(css).toContain('gold');
		expect(css).not.toContain('magenta');
	});
}
