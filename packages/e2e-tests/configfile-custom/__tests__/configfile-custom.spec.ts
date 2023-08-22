import { it, expect } from 'vitest';
import { editViteConfig, isBuild, page, e2eServer } from '~utils';

it('should load default config and work', async () => {
	expect(e2eServer.logs.server.out).toContain('default svelte config loaded');
	expect(await page.textContent('h1')).toMatch('Hello world!');
	expect(await page.textContent('#test-child')).toBe('test-child');
	expect(await page.textContent('#dependency-import')).toBe('dependency-import');
});

if (!isBuild) {
	// editing vite config does not work in build tests, build only runs once
	// TODO split into different tests
	it('should load custom cjs config and work', async () => {
		await editViteConfig((c) =>
			c.replace(/svelte\([^)]*\)/, "svelte({configFile:'svelte.config.custom.cjs'})")
		);
		expect(e2eServer.logs.server.out).toContain('custom svelte config loaded cjs');
		expect(await page.textContent('h1')).toMatch('Hello world!');
		expect(await page.textContent('#test-child')).toBe('test-child');
		expect(await page.textContent('#dependency-import')).toBe('dependency-import');
	});

	it('should not read default config when explicitly disabled', async () => {
		const currentLogPos = e2eServer.logs.server.out.length;
		await editViteConfig((c) => c.replace(/svelte\([^)]*\)/, 'svelte({configFile: false})'));
		const logsAfterChange = e2eServer.logs.server.out.slice(currentLogPos);
		expect(logsAfterChange).not.toContain('default svelte config loaded');
		expect(await page.textContent('h1')).toMatch('Hello world!');
		expect(await page.textContent('#test-child')).toBe('test-child');
		expect(await page.textContent('#dependency-import')).toBe('dependency-import');
	});
}
