import { expect, test } from 'vitest';
import { isBuild, findAssetFile, page, isSvelte4 } from '~utils';

test('should prefix position: sticky for code in source tree', async () => {
	let stickyStyle = isBuild
		? await getStyleFromDist('sticky')
		: await getStyleFromPage(page, 'sticky');
	if (!isSvelte4) {
		// svelte5 doesn't minify rules, do it here to be able to have one expect
		stickyStyle = stickyStyle.replace(/\s/g, '').replace(/;$/, '');
	}
	expect(stickyStyle).toBe('position:-webkit-sticky;position:sticky');
});

/* unfortunately this test fails. the dependency has a different absolute path and .browerslist is not picked up
test('should prefix position: sticky for imported dependency', async () => {
	const stickyStyle = isBuild
		? await getStyleFromDist('sticky-dep')
		: await getStyleFromPage(page,'sticky-dep');
	expect(stickyStyle).toBe('position:-webkit-sticky;position:sticky')
});
*/

async function getStyleFromPage(page, cssClass: string) {
	const styleNodes = await page.$$('head style');
	const styles: string[] = await Promise.all(styleNodes.map((e) => e.textContent()));
	const css = styles.find((s) => s.includes(`.${cssClass}.`));
	return extractStyleContent(css, cssClass);
}

async function getStyleFromDist(cssClass: string) {
	const css = await findAssetFile(/index.*\.css/);
	return extractStyleContent(css, cssClass);
}

function extractStyleContent(css: string, cssClass: string) {
	const match = css.match(new RegExp(`\\.${cssClass}\\.[^\\{]*\\{([^\\}]*)\\}`));
	return match[1];
}
