import {
	editFileAndWaitForHmrComplete,
	getColor,
	getEl,
	getText,
	isBuild,
	testDir,
	sleep,
	untilMatches,
	page,
	browserLogs,
	fetchPageText,
	reloadPage,
	readFileContent,
	IS_SVELTE_BASELINE
} from '~utils';

import glob from 'tiny-glob';
import path from 'node:path';
import { env } from 'node:process';
import * as vite from 'vite';
const {
	defaultClientConditions,
	defaultClientMainFields,
	//@ts-expect-error not typed in vite
	rolldownVersion
} = vite;
import { describe, expect, it } from 'vitest';

describe('kit-node', () => {
	describe('index route', () => {
		it('should hydrate', async () => {
			// check content before hydration
			expect(await getText('h1')).toBe('Hello world!');
			// sometimes jest or playwright is too slow and hydration already kicked in
			// so the next 2 expectations might flake. disable until we switch to a faster setup
			// expect(await getText('#load')).toBe('SERVER_LOADED');
			// expect(await getText('#mount')).toBe('BEFORE_MOUNT');
			expect(await getText('#i18n')).toBe('WELCOME');
			expect(await getText('#env')).toBe('FOOBARENV');
			// check that inline script added the initial node markers
			expect(await page.$eval('#load', (e) => e['__initialNode'])).toBe(true);
			expect(await page.$eval('#mount', (e) => e['__initialNode'])).toBe(true);

			// also get page as text to confirm
			const html = await fetchPageText();
			expect(html).toMatch('Hello world!');
			expect(html).toMatch('SERVER_LOADED');
			expect(html).toMatch('BEFORE_MOUNT');
			expect(html).toMatch('WELCOME');
			expect(html).toMatch('FOOBARENV');

			// wait a bit for hydration to kick in
			await sleep(550);

			// poll for hydrated content
			await untilMatches(() => getText('#mount'), 'AFTER_MOUNT', 'failed to hydrate');
			await untilMatches(() => getText('#load'), 'CLIENT_LOADED', 'failed to hydrate');

			// check that it did not replace the dom elements with new ones
			expect(await page.$eval('#load', (e) => e['__initialNode'])).toBe(true);
			expect(await page.$eval('#mount', (e) => e['__initialNode'])).toBe(true);

			if (isBuild) {
				// TODO additional testing needed here once vite-plugin-svelte implements indexHtmlTransform hook
			}
		});

		it('should have correct styles applied', async () => {
			if (isBuild) {
				expect(await getColor('h1')).toBe('rgb(255, 62, 0)');
			} else {
				// During dev, the CSS is loaded from async chunk and we may have to wait
				// when the test runs concurrently.
				await untilMatches(() => getColor('h1'), 'rgb(255, 62, 0)', 'h1 has svelte orange');
			}
		});

		it('should increase count on click', async () => {
			const button = await getEl('button');
			expect(await getText(button)).toBe('Clicks: 0');
			await button.click();
			expect(await getText(button)).toBe('Clicks: 1');
		});

		it('should not have failed requests', async () => {
			// should have no 404s
			browserLogs.forEach((msg) => {
				expect(msg).not.toMatch('404');
			});
		});

		it('should load dynamic import in onMount', async () => {
			// expect log to contain message with dynamic import value from onMount
			expect(browserLogs.some((x) => x === 'onMount dynamic imported isSSR: false')).toBe(true);
		});

		it('should respect transforms', async () => {
			expect(await getText('#js-transform')).toBe('Hello world');
			expect(await getColor('#css-transform')).toBe('red');
		});

		if (isBuild) {
			// this is known to fail, skip the test in our own CI but keep it in ecosystem-ci so that rolldown-vite-ecosystem-ci still gets this fail
			// TODO remove skip once fixed
			it.skipIf(rolldownVersion && !env.ECOSYSTEM_CI)(
				'should not include dynamic import from onMount in ssr output',
				async () => {
					const ssrManifest = JSON.parse(
						readFileContent('.svelte-kit/output/server/.vite/manifest.json')
					);
					const serverFilesSrc = Object.values(ssrManifest)
						.filter((e) => !!e.src)
						.map((e) => e.src);
					const includesClientOnlyModule = serverFilesSrc.some((file: string) =>
						file.includes('client-only-module')
					);
					expect(includesClientOnlyModule).toBe(false);
				}
			);
			it('should include dynamic import from onmount in client output', async () => {
				const clientManifest = JSON.parse(
					readFileContent('.svelte-kit/output/client/.vite/manifest.json')
				);
				const clientOnlyOutput = clientManifest['src/client-only-module.js'];
				expect(clientOnlyOutput).toBeDefined();
				expect(clientOnlyOutput.isDynamicEntry).toBe(true);
			});
		}

		describe.runIf(!isBuild)('hmr', () => {
			const updatePage = editFileAndWaitForHmrComplete.bind(null, 'src/routes/+page.svelte');

			it('should render additional html', async () => {
				// add div 1
				expect(await getEl('#hmr-test')).toBe(null);
				await updatePage((content) =>
					content.replace(
						'<!-- HMR-TEMPLATE-INJECT -->',
						'<div id="hmr-test">foo</div>\n<!-- HMR-TEMPLATE-INJECT -->'
					)
				);
				expect(await getText('#hmr-test')).toBe('foo');

				// add div 2
				expect(await getEl('#hmr-test2')).toBe(null);
				await updatePage((content) =>
					content.replace(
						'<!-- HMR-TEMPLATE-INJECT -->',
						'<div id="hmr-test2">bar</div>\n<!-- HMR-TEMPLATE-INJECT -->'
					)
				);
				expect(await getText('#hmr-test')).toBe('foo');
				expect(await getText('#hmr-test2')).toBe('bar');
				// remove div 1
				await updatePage((content) => content.replace('<div id="hmr-test">foo</div>\n', ''));
				expect(await getText('#hmr-test')).toBe(null);
				expect(await getText('#hmr-test2')).toBe('bar');
			});

			it('should render additional child components', async () => {
				let buttons = await page.$$('button');
				expect(buttons).toHaveLength(1);
				expect(await getText(buttons[0])).toBe('Clicks: 0');
				await updatePage((content) =>
					content.replace(
						'<!-- HMR-TEMPLATE-INJECT -->',
						'<Counter id="hmr-test-counter"/>\n<!-- HMR-TEMPLATE-INJECT -->'
					)
				);
				buttons = await page.$$('button');
				expect(buttons).toHaveLength(2);
				expect(await getText(buttons[0])).toBe('Clicks: 0');
				expect(await getText(buttons[1])).toBe('Clicks: 0');
				await buttons[1].click();
				expect(await getText(buttons[0])).toBe('Clicks: 0');
				expect(await getText(buttons[1])).toBe('Clicks: 1');
				await updatePage((content) => content.replace('<Counter id="hmr-test-counter"/>\n', ''));
				buttons = await page.$$('button');
				expect(buttons).toHaveLength(1);
				expect(await getText(buttons[0])).toBe('Clicks: 0');
			});

			it('should apply changed styles', async () => {
				expect(await getColor('h1')).toBe('rgb(255, 62, 0)');
				await updatePage((content) => content.replace('color: #ff3e00', 'color: blue'));
				expect(await getColor('h1')).toBe('blue');
				await updatePage((content) => content.replace('color: blue', 'color: green'));
				expect(await getColor('h1')).toBe('green');
			});

			it('should serve changes even after page reload', async () => {
				expect(await getColor('h1')).toBe('green');
				expect(await getText('#hmr-test2')).toBe('bar');
				await reloadPage();
				expect(await getColor('h1')).toBe('green');
				expect(await getText('#hmr-test2')).toBe('bar');
			});

			describe('child component update', () => {
				const updateChild = editFileAndWaitForHmrComplete.bind(null, 'src/lib/Child.svelte');
				const updateCounter = editFileAndWaitForHmrComplete.bind(null, 'src/lib/Counter.svelte');
				it('should preserve dom order', async () => {
					expect(await getText('#before-child')).toBe('before-child');
					expect(await getText('#test-child')).toBe('test-child');
					expect(await getText('#after-child')).toBe('after-child');
					expect(await getEl('#before-child + #test-child')).not.toBe(null);
					expect(await getEl('#test-child + #after-child')).not.toBe(null);
					await updateChild((content) =>
						content.replace('<!-- HMR-TEMPLATE-INJECT -->', '-foo<!-- HMR-TEMPLATE-INJECT -->')
					);
					// for some reason the update takes longer to materialize, so wait for it to avoid subsequent errors
					await page.getByText('test-child-foo').waitFor({ state: 'attached' });

					expect(await getText('#before-child')).toBe('before-child');
					expect(await getText('#test-child')).toBe('test-child-foo');
					expect(await getText('#after-child')).toBe('after-child');
					expect(await getEl('#before-child + #test-child')).not.toBe(null);
					expect(await getEl('#test-child + #after-child')).not.toBe(null);
				});
				it('should render additional html', async () => {
					// add div 1
					expect(await getEl('#hmr-test3')).toBe(null);
					await updateCounter((content) =>
						content.replace(
							'<!-- HMR-TEMPLATE-INJECT -->',
							'<div id="hmr-test3">foo</div>\n<!-- HMR-TEMPLATE-INJECT -->'
						)
					);
					expect(await getText('#hmr-test3')).toBe('foo');

					// add div 2
					expect(await getEl('#hmr-test4')).toBe(null);
					await updateCounter((content) =>
						content.replace(
							'<!-- HMR-TEMPLATE-INJECT -->',
							'<div id="hmr-test4">bar</div>\n<!-- HMR-TEMPLATE-INJECT -->'
						)
					);
					expect(await getText('#hmr-test3')).toBe('foo');
					expect(await getText('#hmr-test4')).toBe('bar');
					// remove div 1
					await updateCounter((content) => content.replace('<div id="hmr-test3">foo</div>\n', ''));
					expect(await getText('#hmr-test3')).toBe(null);
					expect(await getText('#hmr-test4')).toBe('bar');
				});

				it('should apply changed styles', async () => {
					expect(await getColor('button')).toBe('rgb(255, 62, 0)');
					await updateCounter((content) => content.replace('color: #ff3e00', 'color: blue'));
					expect(await getColor('button')).toBe('blue');
					await updateCounter((content) => content.replace('color: blue', 'color: green'));
					expect(await getColor('button')).toBe('green');
				});

				it('should apply changed initial state', async () => {
					expect(await getText('button')).toBe('Clicks: 0');
					await updateCounter((content) => content.replace('let count = 0', 'let count = 2'));
					expect(await getText('button')).toBe('Clicks: 2');
					await updateCounter((content) => content.replace('let count = 2', 'let count = 0'));
					expect(await getText('button')).toBe('Clicks: 0');
				});
			});
		});
	});
	describe('resolved config', () => {
		it('should have generated values', async () => {
			const configs = [];
			if (isBuild) {
				configs.push('serve', 'build', 'build.ssr');
			} else {
				configs.push('serve');
			}
			const expectArrayEqual = (a: string[], b: string[], message: string) => {
				const aSorted = a.slice().sort();
				const bSorted = b.slice().sort();
				expect(aSorted, message).toEqual(bSorted);
			};
			for (const pattern of configs) {
				const filename = `vite.config.${pattern}.json`;
				const config = JSON.parse(
					await readFileContent(path.join('logs', 'resolved-configs', filename))
				);
				const isServe = pattern === 'serve';
				expectArrayEqual(
					config.ssr.external,
					isServe
						? [
								'deepmerge',
								'estree-walker',
								'intl-messageformat',
								'sade',
								'cli-color',
								'tiny-glob',
								'cookie',
								'set-cookie-parser',
								'e2e-test-dep-cjs-and-esm',
								'e2e-test-dep-cjs-only',
								'e2e-test-dep-scss-only'
							]
						: [],
					`ssr.external in ${filename}`
				);
				expectArrayEqual(
					config.ssr.noExternal,
					[
						'svelte',
						'/^svelte\\//', // serialized with toString
						'e2e-test-dep-svelte-api-only',
						'svelte-i18n',
						'esm-env', // first added by svelte-kit
						'esm-env', // second added by vite-plugin-svelte
						'@sveltejs/kit/src/runtime',
						'e2e-test-dep-svelte-nested-workspace-devdep',
						'e2e-test-dep-svelte-simple'
					],
					`ssr.noExternal in ${filename}`
				);
				const expectedExcludes = ['@sveltejs/kit', '$app', '$env'];
				if (!isServe) {
					expectedExcludes.push(
						'e2e-test-dep-svelte-nested-workspace-devdep',
						'e2e-test-dep-svelte-simple'
					);
				}
				expectArrayEqual(
					config.optimizeDeps.exclude,
					expectedExcludes,
					`optimizeDeps.exclude in ${filename}`
				);
				let expectedIncludes = [
					'svelte-i18n',
					'e2e-test-dep-svelte-api-only',
					'svelte/animate',
					'svelte/easing',
					'svelte/events',
					'svelte/internal',
					'svelte/internal/client',
					'svelte/motion',
					'svelte/reactivity',
					'svelte/store',
					'svelte/transition',
					'svelte',
					'svelte/internal/disclose-version',
					'svelte/legacy',
					'svelte-i18n > deepmerge',
					'svelte-i18n > cli-color',
					'svelte-i18n > tiny-glob'
				];
				if (!IS_SVELTE_BASELINE) {
					expectedIncludes.push(
						'svelte/reactivity/window',
						'svelte > clsx',
						'svelte/attachments',
						'svelte/internal/flags/async',
						'svelte/internal/flags/legacy',
						'svelte/internal/flags/tracing'
					);
				}

				expectedIncludes = expectedIncludes.filter(
					(item) => !(isServe && item.startsWith('svelte-i18n >'))
				);

				if (!isServe) {
					expectedIncludes.push(
						'e2e-test-dep-svelte-nested-workspace-devdep > e2e-test-dep-svelte-simple > e2e-test-dep-cjs-only'
					);
				}

				expectArrayEqual(
					config.optimizeDeps.include,
					expectedIncludes,
					`optimizeDeps.include in ${filename}`
				);
				const expectedDedupe = [
					'svelte/animate',
					'svelte/easing',
					'svelte/events',
					'svelte/internal',
					'svelte/internal/client',
					'svelte/motion',
					'svelte/reactivity',
					'svelte/store',
					'svelte/transition',
					'svelte',
					'svelte/internal/disclose-version',
					'svelte/internal/server',
					'svelte/server',
					'svelte/legacy'
				];
				if (!IS_SVELTE_BASELINE) {
					expectedDedupe.push(
						'svelte/attachments',
						'svelte/internal/flags/async',
						'svelte/internal/flags/legacy',
						'svelte/internal/flags/tracing',
						'svelte/reactivity/window'
					);
				}

				expectArrayEqual(config.resolve.dedupe, expectedDedupe, `resolve.dedupe in ${filename}`);
				expectArrayEqual(
					config.resolve.mainFields,
					['svelte', ...defaultClientMainFields],
					`resolve.mainFields in ${filename}`
				);
				expectArrayEqual(
					config.resolve.conditions,
					[...defaultClientConditions, 'svelte'],
					`resolve.conditions in ${filename}`
				);
			}
		});
	});

	describe.runIf(isBuild)('output', () => {
		it('should produce hermetic build', async () => {
			const outputFiles = await glob('./build/**/*', { cwd: testDir, filesOnly: true });
			expect(outputFiles.length).toBeGreaterThan(10);
			const dir = path.basename(testDir);
			const leakingFiles = outputFiles.filter(
				(f) => !f.endsWith('.png') && readFileContent(f).includes(dir)
			);
			if (leakingFiles.length > 0) {
				console.error(
					`These build output files leak parent dir: "${dir}"\n\t${leakingFiles.join('\n\t')}`
				);
			}
			expect(leakingFiles).toEqual([]);
		});
	});
});
