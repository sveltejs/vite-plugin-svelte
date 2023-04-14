import { browserLogs, getColor, getText, isBuild } from '~utils';

test('should not have failed requests', async () => {
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
});

test('should apply css compiled from scss', async () => {
	expect(await getText('#test')).toBe('red');
	expect(await getColor('#test')).toBe('red');
});

if (!isBuild) {
	test('should generate sourcemap', async () => {
		expect(await getText('style')).toMatchSnapshot();
	});
}
