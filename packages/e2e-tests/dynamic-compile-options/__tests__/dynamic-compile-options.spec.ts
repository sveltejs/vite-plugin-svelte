import { getText } from '~utils';

test('should respect dynamic compile option preserveWhitespace: true for A', async () => {
	expect(await getText('#A')).toBe('    preserved leading whitespace');
	expect(await getText('#B')).toBe('removed leading whitespace');
});
