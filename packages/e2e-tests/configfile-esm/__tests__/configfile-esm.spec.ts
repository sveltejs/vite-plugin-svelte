import { it, expect } from 'vitest';
import { editViteConfig, page } from '~utils';

it('should load default config and work', async () => {
	expect(await page.textContent('h1')).toMatch('Hello world!');
	expect(await page.textContent('#test-child')).toBe('test-child');
	expect(await page.textContent('#dependency-import')).toBe('dependency-import');
});

it('should load custom cjs config and work', async () => {
	await editViteConfig((c) =>
		c.replace('svelte()', "svelte({configFile:'svelte.config.custom.cjs'})")
	);
	expect(await page.textContent('h1')).toMatch('Hello world!');
	expect(await page.textContent('#test-child')).toBe('test-child');
	expect(await page.textContent('#dependency-import')).toBe('dependency-import');
});
