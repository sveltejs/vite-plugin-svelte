import { getText } from '~utils';

test('should render svg', async () => {
	expect(await getText('#test-svg')).toBe('Foo bar=bar');
});
