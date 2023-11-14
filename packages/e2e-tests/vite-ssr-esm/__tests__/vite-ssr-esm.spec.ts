import {
	editFileAndWaitForHmrComplete,
	getColor,
	getEl,
	getText,
	isBuild,
	untilMatches,
	page,
	e2eServer,
	browserLogs,
	fetchPageText,
	isSvelte4
} from '~utils';

test('/', async () => {
	expect(await page.textContent('h1')).toMatch('Hello svelte world'); // after hydration

	const html = await fetchPageText();
	expect(html).toMatch('Hello world'); // before hydration
	if (isBuild) {
		// TODO expect preload links
	}
});

test('css', async () => {
	if (isBuild) {
		expect(await getColor('h1')).toBe('green');
	} else {
		// During dev, the CSS is loaded from async chunk and we may have to wait
		// when the test runs concurrently.
		await untilMatches(() => getColor('h1'), 'green', 'h1 has color green');
	}
});

test('loaded esm only package', async () => {
	expect(await page.textContent('#esm')).toMatch('esm');
	expect(browserLogs).toContain('esm');
	expect(e2eServer.logs.server.out).toContain('esm');
});

test('loaded external node esm only package', () => {
	expect(e2eServer.logs.server.out).toContain('hello_world');
});

test('asset', async () => {
	// should have no 404s
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
	const img = await page.$('img');
	expect(await img.getAttribute('src')).toMatch(
		isBuild ? /\/assets\/logo-\w{8}\.png/ : '/src/assets/logo.png'
	);
});

if (!isBuild) {
	describe('hmr', () => {
		const updateApp = editFileAndWaitForHmrComplete.bind(null, 'src/App.svelte');
		test('should render additional html', async () => {
			expect(await getEl('#hmr-test')).toBe(null);
			await updateApp((content) =>
				content.replace(
					'<!-- HMR-TEMPLATE-INJECT -->',
					'<div id="hmr-test">foo</div>\n<!-- HMR-TEMPLATE-INJECT -->'
				)
			);
			await untilMatches(() => getText('#hmr-test'), 'foo', '#hmr-test contains text foo');
		});
		test('should apply style update', async () => {
			expect(await getColor('h1')).toBe('green');
			await updateApp((content) => content.replace('color: green', 'color: red'));
			await untilMatches(() => getColor('h1'), 'red', 'h1 has color red');
		});
		test('should not preserve state of updated props', async () => {
			expect(await getText('#foo')).toBe('foo');
			await updateApp((content) => content.replace("foo = 'foo'", "foo = 'bar'"));
			await untilMatches(() => getText('#foo'), 'bar', '#foo contains text bar');
		});
	});
}
