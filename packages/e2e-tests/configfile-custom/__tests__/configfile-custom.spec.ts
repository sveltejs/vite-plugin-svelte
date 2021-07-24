it('should load config and work', async () => {
	expect(await page.textContent('h1')).toMatch('Hello world!');
	expect(await page.textContent('#test-child')).toBe('test-child');
	expect(await page.textContent('#dependency-import')).toBe('dependency-import');
});
