import { getText } from '../../testUtils';

test('should render svg', async () => {
	expect(await getText('#test-svg')).toBe('Foo bar=bar');
});
