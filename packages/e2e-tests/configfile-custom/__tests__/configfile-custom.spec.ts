it('should load config and work', async () => {
	expect(await page.textContent('h1')).toMatch('Hello world!');
});
