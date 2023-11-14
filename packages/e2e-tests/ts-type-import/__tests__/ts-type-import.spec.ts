import { isBuild, getText, editFileAndWaitForHmrComplete, isSvelte4 } from '~utils';

test('should render App', async () => {
	expect(await getText('#hello')).toBe('Hello world');
	expect(await getText('#foobar')).toBe('foobar');
});

if (!isBuild) {
	describe('hmr', () => {
		const updateApp = editFileAndWaitForHmrComplete.bind(null, 'src/App.svelte');

		test('should update App', async () => {
			expect(await getText('#hello')).toBe('Hello world');
			await updateApp((content) => content.replace('world', 'foo'));
			expect(await getText('#hello')).toBe('Hello foo');
		});
	});
}
