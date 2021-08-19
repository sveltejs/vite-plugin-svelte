import { findSvelteDependencies } from '../dependencies';
import * as path from 'path';

describe('dependencies', () => {
	describe('findSvelteDependencies', () => {
		it('should find svelte dependencies in packages/e2e-test/hmr', async () => {
			const deps = findSvelteDependencies(path.resolve('packages/e2e-tests/hmr'));
			expect(deps).toHaveLength(1);
			expect(deps[0].name).toBe('e2e-tests-hmr-test-dependency');
			expect(deps[0].path).toEqual([]);
		});
		it('should find nested svelte dependencies in packages/e2e-test/package-json-svelte-field', async () => {
			const deps = findSvelteDependencies(
				path.resolve('packages/e2e-tests/package-json-svelte-field')
			);
			expect(deps).toHaveLength(2);
			expect(deps[0].name).toBe('e2e-tests-test-dependency-svelte-field');
			expect(deps[1].name).toBe('e2e-tests-hmr-test-dependency');
			expect(deps[1].path).toEqual(['e2e-tests-test-dependency-svelte-field']);
		});
	});
});
