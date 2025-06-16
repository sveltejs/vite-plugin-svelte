import { it, expect } from 'vitest';
import { editViteConfig, isBuild, page, e2eServer } from '~utils';
import { versions } from 'node:process';

const isNodeWithoutTypeStripping = Number(versions.node?.split('.', 1)[0]) < 22;

it('should load default config and work', async () => {
	expect(e2eServer.logs.server.out).toContain('default svelte config loaded');
	expect(await page.textContent('h1')).toMatch('Hello world!');
	expect(await page.textContent('#test-child')).toBe('test-child');
	expect(await page.textContent('#dependency-import')).toBe('dependency-import');
});

if (!isBuild) {
	// editing vite config does not work in build tests, build only runs once
	// TODO split into different tests
	it.skipIf(isNodeWithoutTypeStripping)('should load custom ts config and work', async () => {
		await editViteConfig((c) =>
			c.replace(/svelte\([^)]*\)/, "svelte({configFile:'svelte.config.custom.ts'})")
		);
		expect(e2eServer.logs.server.out).toContain('custom svelte config loaded ts');
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
