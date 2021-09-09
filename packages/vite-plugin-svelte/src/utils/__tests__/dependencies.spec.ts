import { findRootSvelteDependencies } from '../dependencies';
import * as path from 'path';

describe('dependencies', () => {
	describe('findRootSvelteDependencies', () => {
		it('should find svelte dependencies in packages/e2e-test/hmr', async () => {
			const deps = findRootSvelteDependencies(path.resolve('packages/e2e-tests/hmr'));
			expect(deps).toHaveLength(1);
			expect(deps[0].name).toBe('e2e-test-dep-svelte-simple');
			expect(deps[0].path).toEqual([]);
		});
		it('should find nested svelte dependencies in packages/e2e-test/package-json-svelte-field', async () => {
			const deps = findRootSvelteDependencies(
				path.resolve('packages/e2e-tests/package-json-svelte-field')
			);
			expect(deps).toHaveLength(3);
			const hybrid = deps.find((dep) => dep.name === 'e2e-test-dep-svelte-hybrid');
			expect(hybrid).toBeTruthy();
			expect(hybrid.path).toHaveLength(0);
			const nested = deps.find((dep) => dep.name === 'e2e-test-dep-svelte-nested');
			expect(nested).toBeTruthy();
			expect(nested.path).toHaveLength(0);
			const simple = deps.find((dep) => dep.name === 'e2e-test-dep-svelte-simple');
			expect(simple).toBeTruthy();
			expect(simple.path).toHaveLength(1);
			expect(simple.path[0]).toBe('e2e-test-dep-svelte-nested');
		});
	});
});
