import {
	isBuild,
	getEl,
	getText,
	editFileAndWaitForHmrComplete,
	sleep,
	getColor,
	addFile,
	removeFile,
	page,
	browserLogs
} from '~utils';

test('should render App', async () => {
	expect(await getText('h1')).toBe("I'm blue");
	expect(await getColor('h1')).toBe('blue');
	expect(await getText('h2')).toBe("I'm red");
	expect(await getColor('h2')).toBe('red');
	expect(await getText('p')).toBe("I'm green");
	expect(await getColor('p')).toBe('green');
	expect(await getText('span')).toBe("I'm orangered");
	expect(await getColor('span')).toBe('orangered');
});

test('should not have failed requests', async () => {
	browserLogs.forEach((msg) => {
		expect(msg).not.toMatch('404');
	});
});

if (!isBuild) {
	describe('hmr', () => {
		test('should apply updates when editing App.svelte', async () => {
			expect(await getText('span')).toBe("I'm orangered");
			await editFileAndWaitForHmrComplete('src/App.svelte', (c) =>
				c.replace("I'm orangered", "I'm replaced")
			);
			expect(await getText('span')).toBe("I'm replaced");
			expect(await getColor('span')).toBe('orangered');
			await editFileAndWaitForHmrComplete(
				'src/App.svelte',
				(c) => c.replace('color: orangered', 'color: magenta'),
				'/src/App.svelte?svelte&type=style&lang.css'
			);
			expect(await getColor('span')).toBe('magenta');
		});

		test('should apply updates when editing MultiFile.html', async () => {
			expect(await getText('h1')).toBe("I'm blue");
			expect(await getText('h2')).toBe("I'm red");
			await editFileAndWaitForHmrComplete(
				'src/lib/multifile/MultiFile.html',
				(c) => c.replace("I'm blue", "I'm replaced").replace("I'm red", "I'm replaced too"),
				'/src/lib/multifile/MultiFile.svelte'
			);
			expect(await getText('h1')).toBe("I'm replaced");
			expect(await getText('h2')).toBe("I'm replaced too");
		});

		test('should apply updates when editing MultiFile.scss', async () => {
			expect(await getColor('h1')).toBe('blue');
			await editFileAndWaitForHmrComplete(
				'src/lib/multifile/MultiFile.scss',
				(c) => c.replace('color: blue', 'color: magenta'),
				'/src/lib/multifile/MultiFile.svelte?svelte&type=style&lang.css'
			);
			expect(await getColor('h1')).toBe('magenta');
		});

		test('should apply updates when editing _someImport.scss', async () => {
			expect(await getColor('h2')).toBe('red');
			await editFileAndWaitForHmrComplete(
				'src/lib/multifile/_someImport.scss',
				(c) => c.replace('color: red', 'color: magenta'),
				'/src/lib/multifile/MultiFile.svelte?svelte&type=style&lang.css'
			);
			expect(await getColor('h2')).toBe('magenta');
		});

		test('should remove styles that are no longer imported', async () => {
			expect(await getColor('h2')).toBe('magenta');
			await editFileAndWaitForHmrComplete(
				'src/lib/multifile/MultiFile.scss',
				(c) => c.replace("@import 'someImport';", "/*@import 'someImport';*/"),
				'/src/lib/multifile/MultiFile.svelte?svelte&type=style&lang.css'
			);
			expect(await getColor('h2')).toBe('black');
		});

		test('should apply styles from new dependency', async () => {
			expect(await getColor('h2')).toBe('black');
			await addFile('src/lib/multifile/_foo.scss', 'h2 { color: maroon; }');
			expect(await getColor('h2')).toBe('black');
			await editFileAndWaitForHmrComplete(
				'src/lib/multifile/MultiFile.scss',
				(c) => c.replace("/*@import 'someImport';*/", "/*@import 'someImport';*/\n@import 'foo';"),
				'/src/lib/multifile/MultiFile.svelte?svelte&type=style&lang.css'
			);
			expect(await getColor('h2')).toBe('maroon');
			await editFileAndWaitForHmrComplete(
				'src/lib/multifile/_foo.scss',
				(c) => c.replace('maroon', 'green'),
				'/src/lib/multifile/MultiFile.svelte?svelte&type=style&lang.css'
			);
			expect(await getColor('h2')).toBe('green');
		});

		test('should apply updates when editing MultiFile.ts', async () => {
			expect(await getText('p')).toBe("I'm green");
			await editFileAndWaitForHmrComplete(
				'src/lib/multifile/MultiFile.ts',
				(c) => c.replace("'green'", "'a replaced value'"),
				'/src/lib/multifile/MultiFile.svelte'
			);
			expect(await getText('p')).toBe("I'm a replaced value");
		});

		test('should apply updates when editing someother.css', async () => {
			expect(await getColor('p')).toBe('green');
			await editFileAndWaitForHmrComplete('src/lib/multifile/someother.css', (c) =>
				c.replace('color: green', 'color: magenta')
			);
			expect(await getColor('p')).toBe('magenta');
		});

		test('should show error on deleting dependency', async () => {
			expect(await getColor('h2')).toBe('green');
			await removeFile('src/lib/multifile/_foo.scss');
			expect(await getColor('h2')).toBe('green');
			const errorOverlay = await page.waitForSelector('vite-error-overlay');
			expect(errorOverlay).toBeTruthy();
			await errorOverlay.click({ position: { x: 1, y: 1 } });
			await sleep(50);
			const errorOverlay2 = await getEl('vite-error-overlay');
			expect(errorOverlay2).toBeFalsy();
			await editFileAndWaitForHmrComplete(
				'src/lib/multifile/MultiFile.scss',
				(c) => c.replace("@import 'foo';", ''),
				'/src/lib/multifile/MultiFile.svelte?svelte&type=style&lang.css'
			);
			expect(await getColor('h2')).toBe('black');
		});
	});
}
