import { browserLogs, findAssetFile, getColor, getText, isBuild } from '~utils';

test('should not have failed requests', async () => {
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
});

test('should not apply component css', async () => {
	expect(await getText('#test')).toBe('not red');
	expect(await getColor('#test')).not.toBe('red');
});

if (isBuild) {
	test('should not output css', async () => {
		const css = await findAssetFile(/index.*\.css/);
		expect(css).toBe(''); // findAssetFile returns empty for not found
	});
}
