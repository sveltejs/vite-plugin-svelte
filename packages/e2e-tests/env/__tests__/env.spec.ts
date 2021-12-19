import { findAssetFile, isBuild } from 'testUtils';

if (isBuild) {
	it('custom production mode should build for production', () => {
		const indexBundle = findAssetFile(/index\..*\.js/);
		expect(indexBundle).not.toContain('SvelteComponentDev');
	});
}
