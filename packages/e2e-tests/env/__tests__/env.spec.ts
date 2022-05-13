import { findAssetFile, isBuild } from '~utils';

// can't have no tests for test:serve
it('dummy', () => {});

if (isBuild) {
	it('custom production mode should build for production', () => {
		const indexBundle = findAssetFile(/index\..*\.js/);
		expect(indexBundle).not.toContain('SvelteComponentDev');
	});
}
