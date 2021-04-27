// unfortunately this test does not work as jest is not fully compatible with esm
// wait for jest 27 and see https://github.com/facebook/jest/issues/9430
it('should load config and work', async () => {
	expect(await page.textContent('h1')).toMatch('Hello world!');
});
