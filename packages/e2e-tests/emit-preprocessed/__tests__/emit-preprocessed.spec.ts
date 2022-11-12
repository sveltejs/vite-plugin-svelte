import { getText, isBuild } from '~utils';

test('should render Counter', async () => {
	expect(await getText('button')).toBe('clicks: 0');
});

if (!isBuild) {
	test('should emit preprocessed', () => {
		// TODO read assets and ensure they are what we want
	});
}
