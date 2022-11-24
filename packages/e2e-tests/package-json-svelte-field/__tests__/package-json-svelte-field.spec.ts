import { getText } from '~utils';

test('should render component imported via svelte field in package.json', async () => {
	expect(await getText('#test-id')).toBe('svelte field works');
});
