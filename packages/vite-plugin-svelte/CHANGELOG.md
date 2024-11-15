# @sveltejs/vite-plugin-svelte

## 4.0.1
### Patch Changes


- removed references to compiler options no longer available in svelte5 ([#1010](https://github.com/sveltejs/vite-plugin-svelte/pull/1010))

## 4.0.0
### Major Changes


- only prebundle files with default filenames (.svelte for components, .svelte.(js|ts) for modules) ([#901](https://github.com/sveltejs/vite-plugin-svelte/pull/901))


- remove support for Svelte 4 ([#892](https://github.com/sveltejs/vite-plugin-svelte/pull/892))


- breaking(types): some types that have been unintentionally public are now private ([#934](https://github.com/sveltejs/vite-plugin-svelte/pull/934))


- disable script preprocessing in vitePreprocess() by default because Svelte 5 supports lang=ts out of the box ([#892](https://github.com/sveltejs/vite-plugin-svelte/pull/892))


- replaced svelte-hmr with Svelte 5 compiler hmr integration ([#892](https://github.com/sveltejs/vite-plugin-svelte/pull/892))


### Minor Changes


- allow infix notation for svelte modules ([#901](https://github.com/sveltejs/vite-plugin-svelte/pull/901))
  
  Previously, only suffix notation `.svelte.js` was allowed, now you can also use `.svelte.test.js` or `.svelte.stories.js`.
  This helps when writing testcases or other auxillary code where you may want to use runes too.

- feat(config): dynamically extract list of svelte exports from peer dependency so that new exports work automatically" ([#941](https://github.com/sveltejs/vite-plugin-svelte/pull/941))


- feat(warnings): change default loglevel of warnings originating from files in node_modules to debug. To see them call `DEBUG:vite-plugin-svelte:node-modules-onwarn pnpm build`. ([#989](https://github.com/sveltejs/vite-plugin-svelte/pull/989))


### Patch Changes


- fix: make defaultHandler a required argument for onwarn in plugin options ([#895](https://github.com/sveltejs/vite-plugin-svelte/pull/895))


- prebundle with dev: true by default ([#901](https://github.com/sveltejs/vite-plugin-svelte/pull/901))


- fix(dev): compile with hmr: false for prebundled deps as hmr does not work with that ([#950](https://github.com/sveltejs/vite-plugin-svelte/pull/950))


- fix: ensure svelte modules correctly run in DEV mode ([#906](https://github.com/sveltejs/vite-plugin-svelte/pull/906))


- ensure consistent use of compileOptions.hmr also for prebundling ([#956](https://github.com/sveltejs/vite-plugin-svelte/pull/956))


- fix(optimizeDeps): avoid to optimise server only entrypoints of svelte that are never used on the client ([#941](https://github.com/sveltejs/vite-plugin-svelte/pull/941))


- update peer on workspace packages to avoid packages bumping each other ([#916](https://github.com/sveltejs/vite-plugin-svelte/pull/916))


- export PluginOptions interface ([#976](https://github.com/sveltejs/vite-plugin-svelte/pull/976))


- Remove log about experimental status of Svelte 5. Note that breaking changes can still occur while vite-plugin-svelte 4 is in prerelease mode ([#894](https://github.com/sveltejs/vite-plugin-svelte/pull/894))


- fix: ensure vite config is only resolved once during lazy init of vitePreprocess ([#912](https://github.com/sveltejs/vite-plugin-svelte/pull/912))


- fix(vitePreprocess): default to build config so that svelte-check does not trigger dev-only plugins ([#931](https://github.com/sveltejs/vite-plugin-svelte/pull/931))


- fix: only apply infix filter to basename ([#920](https://github.com/sveltejs/vite-plugin-svelte/pull/920))


- fix: disable hmr when vite config server.hmr is false ([#913](https://github.com/sveltejs/vite-plugin-svelte/pull/913))


- fix(dev): make sure custom cssHash is applied consistently even for prebundled components to avoid hash mismatches during hydration ([#950](https://github.com/sveltejs/vite-plugin-svelte/pull/950))

- Updated dependencies [[`22baa25`](https://github.com/sveltejs/vite-plugin-svelte/commit/22baa25b5e98ddc92715bfc430dc9d0cfad99bb0), [`49324db`](https://github.com/sveltejs/vite-plugin-svelte/commit/49324dbf747a46ae75b405a29fc7feac2db966dd), [`e9f048c`](https://github.com/sveltejs/vite-plugin-svelte/commit/e9f048c362a0769b3d5afa87da6f8398f46fe1a9), [`213fedd`](https://github.com/sveltejs/vite-plugin-svelte/commit/213fedd68ec2c5fcb41752e05dcded4abfa8d0c0)]:
  - @sveltejs/vite-plugin-svelte-inspector@3.0.0

## 4.0.0-next.8
### Minor Changes


- feat(warnings): change default loglevel of warnings originating from files in node_modules to debug. To see them call `DEBUG:vite-plugin-svelte:node-modules-onwarn pnpm build`. ([#989](https://github.com/sveltejs/vite-plugin-svelte/pull/989))

## 4.0.0-next.7
### Patch Changes


- export PluginOptions interface ([#976](https://github.com/sveltejs/vite-plugin-svelte/pull/976))

## 4.0.0-next.6
### Patch Changes


- ensure consistent use of compileOptions.hmr also for prebundling ([#956](https://github.com/sveltejs/vite-plugin-svelte/pull/956))

## 4.0.0-next.5
### Patch Changes


- fix(dev): compile with hmr: false for prebundled deps as hmr does not work with that ([#950](https://github.com/sveltejs/vite-plugin-svelte/pull/950))


- fix(dev): make sure custom cssHash is applied consistently even for prebundled components to avoid hash mismatches during hydration ([#950](https://github.com/sveltejs/vite-plugin-svelte/pull/950))

## 4.0.0-next.4
### Major Changes


- breaking(types): some types that have been unintentionally public are now private ([#934](https://github.com/sveltejs/vite-plugin-svelte/pull/934))


### Minor Changes


- feat(config): dynamically extract list of svelte exports from peer dependency so that new exports work automatically" ([#941](https://github.com/sveltejs/vite-plugin-svelte/pull/941))


### Patch Changes


- fix(optimizeDeps): avoid to optimise server only entrypoints of svelte that are never used on the client ([#941](https://github.com/sveltejs/vite-plugin-svelte/pull/941))


- fix(vitePreprocess): default to build config so that svelte-check does not trigger dev-only plugins ([#931](https://github.com/sveltejs/vite-plugin-svelte/pull/931))

- Updated dependencies [[`e9f048c362a0769b3d5afa87da6f8398f46fe1a9`](https://github.com/sveltejs/vite-plugin-svelte/commit/e9f048c362a0769b3d5afa87da6f8398f46fe1a9)]:
  - @sveltejs/vite-plugin-svelte-inspector@3.0.0-next.3

## 4.0.0-next.3
### Patch Changes


- fix: only apply infix filter to basename ([#920](https://github.com/sveltejs/vite-plugin-svelte/pull/920))

## 4.0.0-next.2
### Patch Changes


- update peer on workspace packages to avoid packages bumping each other ([#916](https://github.com/sveltejs/vite-plugin-svelte/pull/916))


- fix: ensure vite config is only resolved once during lazy init of vitePreprocess ([#912](https://github.com/sveltejs/vite-plugin-svelte/pull/912))


- fix: disable hmr when vite config server.hmr is false ([#913](https://github.com/sveltejs/vite-plugin-svelte/pull/913))

## 4.0.0-next.1

### Major Changes

- only prebundle files with default filenames (.svelte for components, .svelte.(js|ts) for modules) ([#901](https://github.com/sveltejs/vite-plugin-svelte/pull/901))

### Minor Changes

- allow infix notation for svelte modules ([#901](https://github.com/sveltejs/vite-plugin-svelte/pull/901))

  Previously, only suffix notation `.svelte.js` was allowed, now you can also use `.svelte.test.js` or `.svelte.stories.js`.
  This helps when writing testcases or other auxillary code where you may want to use runes too.

### Patch Changes

- prebundle with dev: true by default ([#901](https://github.com/sveltejs/vite-plugin-svelte/pull/901))

- fix: ensure svelte modules correctly run in DEV mode ([#906](https://github.com/sveltejs/vite-plugin-svelte/pull/906))

- Updated dependencies []:
  - @sveltejs/vite-plugin-svelte-inspector@3.0.0-next.1

## 4.0.0-next.0

### Major Changes

- remove support for Svelte 4 ([#892](https://github.com/sveltejs/vite-plugin-svelte/pull/892))

- disable script preprocessing in vitePreprocess() by default because Svelte 5 supports lang=ts out of the box ([#892](https://github.com/sveltejs/vite-plugin-svelte/pull/892))

- replaced svelte-hmr with Svelte 5 compiler hmr integration ([#892](https://github.com/sveltejs/vite-plugin-svelte/pull/892))

### Patch Changes

- fix: make defaultHandler a required argument for onwarn in plugin options ([#895](https://github.com/sveltejs/vite-plugin-svelte/pull/895))

- Remove log about experimental status of Svelte 5. Note that breaking changes can still occur while vite-plugin-svelte 4 is in prerelease mode ([#894](https://github.com/sveltejs/vite-plugin-svelte/pull/894))

- Updated dependencies [[`49324dbf747a46ae75b405a29fc7feac2db966dd`](https://github.com/sveltejs/vite-plugin-svelte/commit/49324dbf747a46ae75b405a29fc7feac2db966dd)]:
  - @sveltejs/vite-plugin-svelte-inspector@3.0.0-next.0

## 3.1.0

### Minor Changes

- feat(svelte5): enable hmr option in dev ([#836](https://github.com/sveltejs/vite-plugin-svelte/pull/836))

### Patch Changes

- Remove unnecessary `enableSourcemap` option usage and prevent passing it in Svelte 5 ([#862](https://github.com/sveltejs/vite-plugin-svelte/pull/862))

- Updated dependencies [[`8ae3dc8cf415355f406f23d6104cb6153d75dfc8`](https://github.com/sveltejs/vite-plugin-svelte/commit/8ae3dc8cf415355f406f23d6104cb6153d75dfc8)]:
  - @sveltejs/vite-plugin-svelte-inspector@2.1.0

## 3.0.2

### Patch Changes

- fix(compile): correctly determine script lang in files where a comment precedes the script tag ([#844](https://github.com/sveltejs/vite-plugin-svelte/pull/844))

## 3.0.1

### Patch Changes

- fix: improve checking of script and style in .svelte code to work with new generic= attribute ([#799](https://github.com/sveltejs/vite-plugin-svelte/pull/799))

- Fix optional parameter types ([#797](https://github.com/sveltejs/vite-plugin-svelte/pull/797))

- Update log level for HMR updates where the output is functionally equivalent to the previous version to "debug" ([#806](https://github.com/sveltejs/vite-plugin-svelte/pull/806))

## 3.0.0

### Major Changes

- breaking: update minimum supported node version to node18 ([#744](https://github.com/sveltejs/vite-plugin-svelte/pull/744))

- breaking: update supported vite version to vite 5 ([#743](https://github.com/sveltejs/vite-plugin-svelte/pull/743))

- breaking: remove support for svelte 3 ([#746](https://github.com/sveltejs/vite-plugin-svelte/pull/746))

- Preprocess style tags by default with vitePreprocess ([#756](https://github.com/sveltejs/vite-plugin-svelte/pull/756))

- breaking: remove package.json export ([#751](https://github.com/sveltejs/vite-plugin-svelte/pull/751))

- breaking(types): emit types with dts-buddy to include type map ([#751](https://github.com/sveltejs/vite-plugin-svelte/pull/751))

- breaking(debug): remove 'vite:' and add suffixes to debug namespace ([#749](https://github.com/sveltejs/vite-plugin-svelte/pull/749))

- breaking(types): rename SvelteOptions to SvelteConfig ([#751](https://github.com/sveltejs/vite-plugin-svelte/pull/751))

- breaking: prefer svelte exports condition over package.json svelte field ([#747](https://github.com/sveltejs/vite-plugin-svelte/pull/747))

### Minor Changes

- feat(preprocess): add warnings in case preprocess dependencies contain anomalies ([#767](https://github.com/sveltejs/vite-plugin-svelte/pull/767))

- Add experimental support for svelte5 ([#787](https://github.com/sveltejs/vite-plugin-svelte/pull/787))

### Patch Changes

- fix(types): use correct type Options for svelte function arg ([#751](https://github.com/sveltejs/vite-plugin-svelte/pull/751))

- Improve compile error messages ([#757](https://github.com/sveltejs/vite-plugin-svelte/pull/757))

- feat(compile): promote experimental.dynamicCompileOptions to stable ([#765](https://github.com/sveltejs/vite-plugin-svelte/pull/765))

- update peer dependencies to use final releases ([#794](https://github.com/sveltejs/vite-plugin-svelte/pull/794))

- Updated dependencies [[`d5b952f`](https://github.com/sveltejs/vite-plugin-svelte/commit/d5b952f88253e39458a1fbc0a0231b939bba338d), [`bd5d43e`](https://github.com/sveltejs/vite-plugin-svelte/commit/bd5d43e765d35b52b613ddcfd00b8d75491a7d98), [`10ec2a4`](https://github.com/sveltejs/vite-plugin-svelte/commit/10ec2a4429623382cc1a700fe91c129616bca3ef), [`62afd80`](https://github.com/sveltejs/vite-plugin-svelte/commit/62afd80c3a7bd6430be3c552acdb8baa75aac995), [`1be1c08`](https://github.com/sveltejs/vite-plugin-svelte/commit/1be1c085ed75eb8d84cedc5b45077400edd720ef)]:
  - @sveltejs/vite-plugin-svelte-inspector@2.0.0

## 3.0.0-next.3

### Minor Changes

- Add experimental support for svelte5 ([#787](https://github.com/sveltejs/vite-plugin-svelte/pull/787))

## 3.0.0-next.2

### Major Changes

- breaking: remove package.json export ([#751](https://github.com/sveltejs/vite-plugin-svelte/pull/751))

- breaking(types): emit types with dts-buddy to include type map ([#751](https://github.com/sveltejs/vite-plugin-svelte/pull/751))

- breaking(types): rename SvelteOptions to SvelteConfig ([#751](https://github.com/sveltejs/vite-plugin-svelte/pull/751))

### Patch Changes

- fix(types): use correct type Options for svelte function arg ([#751](https://github.com/sveltejs/vite-plugin-svelte/pull/751))

- Updated dependencies [[`62afd80`](https://github.com/sveltejs/vite-plugin-svelte/commit/62afd80c3a7bd6430be3c552acdb8baa75aac995)]:
  - @sveltejs/vite-plugin-svelte-inspector@2.0.0-next.1

## 3.0.0-next.1

### Major Changes

- Preprocess style tags by default with vitePreprocess ([#756](https://github.com/sveltejs/vite-plugin-svelte/pull/756))

### Minor Changes

- feat(preprocess): add warnings in case preprocess dependencies contain anomalies ([#767](https://github.com/sveltejs/vite-plugin-svelte/pull/767))

### Patch Changes

- Improve compile error messages ([#757](https://github.com/sveltejs/vite-plugin-svelte/pull/757))

- feat(compile): promote experimental.dynamicCompileOptions to stable ([#765](https://github.com/sveltejs/vite-plugin-svelte/pull/765))

## 3.0.0-next.0

### Major Changes

- breaking: update minimum supported node version to node18 ([#744](https://github.com/sveltejs/vite-plugin-svelte/pull/744))

- breaking: update supported vite version to vite 5 ([#743](https://github.com/sveltejs/vite-plugin-svelte/pull/743))

- breaking: remove support for svelte 3 ([#746](https://github.com/sveltejs/vite-plugin-svelte/pull/746))

- breaking(debug): remove 'vite:' and add suffixes to debug namespace ([#749](https://github.com/sveltejs/vite-plugin-svelte/pull/749))

- breaking: prefer svelte exports condition over package.json svelte field ([#747](https://github.com/sveltejs/vite-plugin-svelte/pull/747))

### Patch Changes

- Updated dependencies [[`d5b952f`](https://github.com/sveltejs/vite-plugin-svelte/commit/d5b952f88253e39458a1fbc0a0231b939bba338d), [`bd5d43e`](https://github.com/sveltejs/vite-plugin-svelte/commit/bd5d43e765d35b52b613ddcfd00b8d75491a7d98), [`10ec2a4`](https://github.com/sveltejs/vite-plugin-svelte/commit/10ec2a4429623382cc1a700fe91c129616bca3ef)]:
  - @sveltejs/vite-plugin-svelte-inspector@2.0.0-next.0

## 2.4.6

### Patch Changes

- fix(prebundleSvelteLibraries): don't try to append missing sourcemap ([#737](https://github.com/sveltejs/vite-plugin-svelte/pull/737))

## 2.4.5

### Patch Changes

- fix(config): ignore @sveltejs/package and svelte2tsx for optimizeDeps.include and ssr.noExternal generated config ([#711](https://github.com/sveltejs/vite-plugin-svelte/pull/711))

## 2.4.4

### Patch Changes

- fix links in error handling (console and vite overlay) ([#700](https://github.com/sveltejs/vite-plugin-svelte/pull/700))

## 2.4.3

### Patch Changes

- add svelte/internal/disclose-version to vite config optimizeDeps.include by default ([#692](https://github.com/sveltejs/vite-plugin-svelte/pull/692))

## 2.4.2

### Patch Changes

- fix: remove pure comments only for Svelte 3 ([#673](https://github.com/sveltejs/vite-plugin-svelte/pull/673))

- Bump supported Svelte 4 version to `^4.0.0` ([#675](https://github.com/sveltejs/vite-plugin-svelte/pull/675))

- Updated dependencies [[`ffbe8d3`](https://github.com/sveltejs/vite-plugin-svelte/commit/ffbe8d3ebf8b726a31b7614a38ce4b3a0fad7776)]:
  - @sveltejs/vite-plugin-svelte-inspector@1.0.3

## 2.4.1

### Patch Changes

- Ensure compatibility with Svelte 4 prereleases ([#661](https://github.com/sveltejs/vite-plugin-svelte/pull/661))

  Note: We are going to remove `-next` from the Svelte peerDependency range in a minor release once Svelte `4.0.0` final has been released.

- Updated dependencies [[`f5d9bd2`](https://github.com/sveltejs/vite-plugin-svelte/commit/f5d9bd239e23a73417f684c79ba893df42440915)]:
  - @sveltejs/vite-plugin-svelte-inspector@1.0.2

## 2.4.0

### Minor Changes

- refactor: release vite-plugin-svelte as unbundled javascript with jsdoc types ([#657](https://github.com/sveltejs/vite-plugin-svelte/pull/657))

## 2.3.0

### Minor Changes

- Refactor Svelte inspector as a separate package ([#646](https://github.com/sveltejs/vite-plugin-svelte/pull/646))

### Patch Changes

- remove unused invalid property Code.dependencies on compiler ouput type ([#652](https://github.com/sveltejs/vite-plugin-svelte/pull/652))

- fix(build): watch preprocessor dependencies during build --watch ([#653](https://github.com/sveltejs/vite-plugin-svelte/pull/653))

- Updated dependencies [[`1dd6933`](https://github.com/sveltejs/vite-plugin-svelte/commit/1dd69334240cea76e7db57b5ef1d70ed7f02c8f4)]:
  - @sveltejs/vite-plugin-svelte-inspector@1.0.1

## 2.2.0

### Minor Changes

- feat(inspector): Promote experimental.inspector to regular option ([#631](https://github.com/sveltejs/vite-plugin-svelte/pull/631))

- feat(inspector): allow configuration via environment SVELTE_INSPECTOR_OPTIONS or SVELTE_INSPECTOR_TOGGLE ([#631](https://github.com/sveltejs/vite-plugin-svelte/pull/631))

- feat(inspector): enable holdMode by default ([#631](https://github.com/sveltejs/vite-plugin-svelte/pull/631))

- Remove internal SvelteKit specific handling ([#638](https://github.com/sveltejs/vite-plugin-svelte/pull/638))

### Patch Changes

- fix(inspector): prepend vite base when calling \_\_openInEditor ([#631](https://github.com/sveltejs/vite-plugin-svelte/pull/631))

- fix(inspector): after a file has been opened, automatically disable inspector on leaving browser ([#631](https://github.com/sveltejs/vite-plugin-svelte/pull/631))

- fix(inspector): use control-shift as default keycombo on linux to avoid problems in firefox ([#631](https://github.com/sveltejs/vite-plugin-svelte/pull/631))

- fix(svelte-inspector): mount outside body to avoid hydration claiming body removing it ([#631](https://github.com/sveltejs/vite-plugin-svelte/pull/631))

## 2.1.1

### Patch Changes

- fix(resolve): normalize path resolved from "svelte" field to ensure consistency across operating systems ([#635](https://github.com/sveltejs/vite-plugin-svelte/pull/635))

## 2.1.0

### Minor Changes

- log warnings for packages that use the `svelte` field to resolve Svelte files differently than standard Vite resolve ([#510](https://github.com/sveltejs/vite-plugin-svelte/pull/510))

### Patch Changes

- fix(vitePreprocess): add dependencies to style preprocessor output ([#625](https://github.com/sveltejs/vite-plugin-svelte/pull/625))

- Skip Vite resolve workaround on Vite 4.1+ or Svelte 4+ ([#622](https://github.com/sveltejs/vite-plugin-svelte/pull/622))

- fix(vitePreprocess): use relative paths without lang suffix in sourcemaps to avoid missing source file errors. ([#625](https://github.com/sveltejs/vite-plugin-svelte/pull/625))

- Log stats in debug mode and remove `experimental.disableCompileStats` option. Use `DEBUG="vite:vite-plugin-svelte:stats"` when starting the dev server or build to log the compile stats. ([#614](https://github.com/sveltejs/vite-plugin-svelte/pull/614))

## 2.0.4

### Patch Changes

- fix(vitePreprocess): remove problematic pure annotations that could lead to wrong build output in some cases ([#609](https://github.com/sveltejs/vite-plugin-svelte/pull/609))

## 2.0.3

### Patch Changes

- fix(vitePreprocess): use relative paths in sourcemap sources ([#570](https://github.com/sveltejs/vite-plugin-svelte/pull/570))

- show correct error overlay for compiler errors during hot update ([#592](https://github.com/sveltejs/vite-plugin-svelte/pull/592))

- respect custom resolve.mainFields config when adding svelte ([#582](https://github.com/sveltejs/vite-plugin-svelte/pull/582))

## 2.0.2

### Patch Changes

- improve detection of sveltekit in inspector plugin to be compatible to latest changes ([`47c54c9`](https://github.com/sveltejs/vite-plugin-svelte/commit/47c54c92b886ea9d9bdd1fc7549079b39215ccd1))

## 2.0.1

### Patch Changes

- update minimum version of vitefu dependency to avoid peer mismatch ([#543](https://github.com/sveltejs/vite-plugin-svelte/pull/543))

## 2.0.0

### Major Changes

- update svelte peerDependency to ^3.54.0 ([#529](https://github.com/sveltejs/vite-plugin-svelte/pull/529))

- remove commonjs variant of vite-plugin-svelte ([#522](https://github.com/sveltejs/vite-plugin-svelte/pull/522))

  Make sure your package.json contains `"type": "module"`and see [FAQ](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#how-can-i-use-vite-plugin-svelte-from-commonjs) for more information

- update vite peerDependency to vite-4 ([#521](https://github.com/sveltejs/vite-plugin-svelte/pull/521))

### Patch Changes

- Remove `experimental.useVitePreprocess` option in favour of `vitePreprocess` ([#538](https://github.com/sveltejs/vite-plugin-svelte/pull/538))

- Remove pre Vite 3.2 support for `vitePreprocess` ([#536](https://github.com/sveltejs/vite-plugin-svelte/pull/536))

## 2.0.0-beta.3

### Patch Changes

- Remove `experimental.useVitePreprocess` option in favour of `vitePreprocess` ([#538](https://github.com/sveltejs/vite-plugin-svelte/pull/538))

- Remove pre Vite 3.2 support for `vitePreprocess` ([#536](https://github.com/sveltejs/vite-plugin-svelte/pull/536))

## 2.0.0-beta.2

### Major Changes

- reintroduce custom svelte/ssr resolve ([#532](https://github.com/sveltejs/vite-plugin-svelte/pull/532))

## 2.0.0-beta.1

### Major Changes

- remove custom svelte/ssr resolve that is no longer needed in vite 4 ([#527](https://github.com/sveltejs/vite-plugin-svelte/pull/527))

- update svelte peerDependency to ^3.54.0 ([#529](https://github.com/sveltejs/vite-plugin-svelte/pull/529))

## 2.0.0-beta.0

### Major Changes

- remove cjs build ([#522](https://github.com/sveltejs/vite-plugin-svelte/pull/522))

- update vite peerDependency to vite-4 ([#521](https://github.com/sveltejs/vite-plugin-svelte/pull/521))

## 1.4.0

### Minor Changes

- support `&direct` and `&raw` query parameters for svelte requests ([#513](https://github.com/sveltejs/vite-plugin-svelte/pull/513))

- Export `vitePreprocess()` Svelte preprocessor ([#509](https://github.com/sveltejs/vite-plugin-svelte/pull/509))

### Patch Changes

- ensure sources paths in sourcemaps are not absolute file paths ([#513](https://github.com/sveltejs/vite-plugin-svelte/pull/513))

- remove experimental.generateMissingPreprocessorSourcemaps ([#514](https://github.com/sveltejs/vite-plugin-svelte/pull/514))

## 1.3.1

### Patch Changes

- improve robustness of compile stats taking ([#507](https://github.com/sveltejs/vite-plugin-svelte/pull/507))

## 1.3.0

### Minor Changes

- enable `prebundleSvelteLibraries` during dev by default to improve page loading for the dev server. ([#494](https://github.com/sveltejs/vite-plugin-svelte/pull/494))

  see the [FAQ](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#what-is-going-on-with-vite-and-pre-bundling-dependencies) for more information about `prebundleSvelteLibraries` and how to tune it.

- Enable resolving via "svelte" exports condition ([#502](https://github.com/sveltejs/vite-plugin-svelte/pull/502))

- add compile time stats logging ([#503](https://github.com/sveltejs/vite-plugin-svelte/pull/503))

## 1.2.0

### Minor Changes

- support string values of compilerOptions.css added in svelte 3.53.0 ([#490](https://github.com/sveltejs/vite-plugin-svelte/pull/490))

### Patch Changes

- simplify init of compilerOptions.hydratable for kit (kit.browser.hydrate is no longer in use) ([#496](https://github.com/sveltejs/vite-plugin-svelte/pull/496))

- when prebundleSvelteLibraries is true and a dependency is manually excluded, generate reincludes for it's cjs deps ([#493](https://github.com/sveltejs/vite-plugin-svelte/pull/493))

- Refactor Svelte libraries config handling ([#478](https://github.com/sveltejs/vite-plugin-svelte/pull/478))

- fix(prebundleSvelteLibraries): avoid resolving via svelte field after a library has been prebundled ([#482](https://github.com/sveltejs/vite-plugin-svelte/pull/482))

## 1.1.1

### Patch Changes

- Use `preprocessCSS` API from Vite 3.2 for `useVitePreprocess` option ([#479](https://github.com/sveltejs/vite-plugin-svelte/pull/479))

- add types to exports map in package.json ([#488](https://github.com/sveltejs/vite-plugin-svelte/pull/488))

## 1.1.0

### Minor Changes

- Bring `prebundleSvelteLibraries` out of experimental, it is now a top-level option ([#476](https://github.com/sveltejs/vite-plugin-svelte/pull/476))

### Patch Changes

- Remove `@rollup/pluginutils` dependency ([#469](https://github.com/sveltejs/vite-plugin-svelte/pull/469))

## 1.0.9

### Patch Changes

- Use esnext for useVitePreprocess ([#452](https://github.com/sveltejs/vite-plugin-svelte/pull/452))

## 1.0.8

### Patch Changes

- svelte-inspector: select hovered element instead of parent on mousemouse ([#449](https://github.com/sveltejs/vite-plugin-svelte/pull/449))

- svelte-inspector: ignore navigation keys while not enabled ([#449](https://github.com/sveltejs/vite-plugin-svelte/pull/449))

## 1.0.7

### Patch Changes

- svelte-inspector: prevent info-bubble select ([#445](https://github.com/sveltejs/vite-plugin-svelte/pull/445))

## 1.0.6

### Patch Changes

- update svelte-hmr and enable partial hmr accept by default (fixes [#134](https://github.com/sveltejs/vite-plugin-svelte/issues/134)) ([#440](https://github.com/sveltejs/vite-plugin-svelte/pull/440))

- svelte-inspector: add keyboard navigation, select element on activation, improve a11y and info bubble position/content ([#438](https://github.com/sveltejs/vite-plugin-svelte/pull/438))

## 1.0.5

### Patch Changes

- removed peerDependency for vite 3.1.0-beta as vite 3.1.0 final has been released ([#431](https://github.com/sveltejs/vite-plugin-svelte/pull/431))

## 1.0.4

### Patch Changes

- temporarily add vite 3.1 beta to peer dependencies rule to avoid warning on kit projects using it ([#427](https://github.com/sveltejs/vite-plugin-svelte/pull/427))

  **warning:** this is going to be changed back to `^3.0.0` in a future patch

## 1.0.3

### Patch Changes

- ignore keyup events without key in inspector ([#417](https://github.com/sveltejs/vite-plugin-svelte/pull/417))

* fix svelte-inspector import for vite 3.1 ([#423](https://github.com/sveltejs/vite-plugin-svelte/pull/423))

## 1.0.2

### Patch Changes

- update svelte-inspector inject code to be compatible with @sveltejs/kit > 1.0.0-next.405 ([#411](https://github.com/sveltejs/vite-plugin-svelte/pull/411))

## 1.0.1

### Major Changes

- update to vite3 ([#359](https://github.com/sveltejs/vite-plugin-svelte/pull/359))

* bump minimum required node version to 14.18.0 to align with vite 3 ([#359](https://github.com/sveltejs/vite-plugin-svelte/pull/359))

- move plugin options in svelte.config.js into "vitePlugin" ([#389](https://github.com/sveltejs/vite-plugin-svelte/pull/389))

  update your svelte.config.js and wrap [plugin options](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#plugin-options) with `vitePlugin`

  ```diff
  // svelte.config.js

    compilerOptions: {...},
    preprocess: {...},
    extensions: [...],
    onwarn: () => {...},
    kit: {},
  + vitePlugin: {
     // include, exclude, emitCss, hot, ignorePluginPreprocessors, disableDependencyReinclusion, experimental
  + }
  ```

### Patch Changes

- Always add dependencies using svelte to ssr.noExternal in vite config ([#359](https://github.com/sveltejs/vite-plugin-svelte/pull/359))

## 1.0.0-next.49

### Minor Changes

- New experimental option sendWarningsToBrowser ([#372](https://github.com/sveltejs/vite-plugin-svelte/pull/372))

### Patch Changes

- fix hmr not updating a component when returning to the last working state from an error state ([#371](https://github.com/sveltejs/vite-plugin-svelte/pull/371))

## 1.0.0-next.48

### Minor Changes

- Automate setting of compilerOptions.hydratable from kit.browser.hydrate option ([#368](https://github.com/sveltejs/vite-plugin-svelte/pull/368))

### Patch Changes

- Do not try to resolve svelte field in \_\_vite-browser-external, see (#362)" ([#363](https://github.com/sveltejs/vite-plugin-svelte/pull/363))

## 1.0.0-next.47

### Patch Changes

- Use last modified time as cache busting parameter ([#356](https://github.com/sveltejs/vite-plugin-svelte/pull/356))

* Export loadSvelteConfig ([#356](https://github.com/sveltejs/vite-plugin-svelte/pull/356))

## 1.0.0-next.46

### Patch Changes

- Bump svelte-hmr version ([#349](https://github.com/sveltejs/vite-plugin-svelte/pull/349))

## 1.0.0-next.45

### Patch Changes

- Handle inspector autocomplete keydown event ([#338](https://github.com/sveltejs/vite-plugin-svelte/pull/338))

* Remove user-specified values for essential compilerOptions generate, format, cssHash and filename and log a warning ([#346](https://github.com/sveltejs/vite-plugin-svelte/pull/346))

- fix inspector not initializing correctly for sveltekit on windows (see [#342](https://github.com/sveltejs/vite-plugin-svelte/issues/342)) ([#344](https://github.com/sveltejs/vite-plugin-svelte/pull/344))

## 1.0.0-next.44

### Patch Changes

- correctly resolve the experimental svelte inspector (see [#332](https://github.com/sveltejs/vite-plugin-svelte/issues/332)) (fixes [#330](https://github.com/sveltejs/vite-plugin-svelte/issues/330)) ([#333](https://github.com/sveltejs/vite-plugin-svelte/pull/333))

## 1.0.0-next.43

### Minor Changes

- Add experimental Svelte Inspector to quickly jump to code from your browser. ([#322](https://github.com/sveltejs/vite-plugin-svelte/pull/322))

### Patch Changes

- use deepmerge utility to merge inline config and svelte.config.js ([#322](https://github.com/sveltejs/vite-plugin-svelte/pull/322))

* do not warn if kit options are passed as inline config ([#319](https://github.com/sveltejs/vite-plugin-svelte/pull/319))

- Support import typescript files with .js extension ([#324](https://github.com/sveltejs/vite-plugin-svelte/pull/324))

* do not restart vite devserver on changes of svelte config when `configFile: false` is set ([#319](https://github.com/sveltejs/vite-plugin-svelte/pull/319))

## 1.0.0-next.42

### Minor Changes

- skip reading default svelte config file with inline option `configFile: false` ([#317](https://github.com/sveltejs/vite-plugin-svelte/pull/317))

## 1.0.0-next.41

### Major Changes

- Update vite peerDependency to ^2.9.0 and handle edge cases for `experimental.prebundleSvelteLibraries` ([#294](https://github.com/sveltejs/vite-plugin-svelte/pull/294))

### Patch Changes

- Improved CSS Source Maps when using vite's `css: { devSourcemap: true }` ([#305](https://github.com/sveltejs/vite-plugin-svelte/pull/305))

## 1.0.0-next.40

### Patch Changes

- improve handling of transitive cjs dependencies of svelte libraries during dev ssr ([#289](https://github.com/sveltejs/vite-plugin-svelte/pull/289))

## 1.0.0-next.39

### Patch Changes

- prevent errors in resolveViaPackageJsonSvelte breaking vite resolve (fixes [#283](https://github.com/sveltejs/vite-plugin-svelte/issues/283)) ([#286](https://github.com/sveltejs/vite-plugin-svelte/pull/286))

## 1.0.0-next.38

### Patch Changes

- don't warn if dependency doesn't export package.json ([#272](https://github.com/sveltejs/vite-plugin-svelte/pull/272))

* Optimize nested index-only dependencies ([#282](https://github.com/sveltejs/vite-plugin-svelte/pull/282))

- Remove transforming svelte css ([#280](https://github.com/sveltejs/vite-plugin-svelte/pull/280))

## 1.0.0-next.37

### Patch Changes

- don't try to resolve node internal modules via package.json svelte field ([#266](https://github.com/sveltejs/vite-plugin-svelte/pull/266))

## 1.0.0-next.36

### Patch Changes

- include stack and filename in error reporting for svelte preprocess errors ([#260](https://github.com/sveltejs/vite-plugin-svelte/pull/260))

## 1.0.0-next.35

### Patch Changes

- do not use require-relative to resolve svelte field of libraries and cache resolved values (fixes [#244](https://github.com/sveltejs/vite-plugin-svelte/issues/244)) ([#254](https://github.com/sveltejs/vite-plugin-svelte/pull/254))

## 1.0.0-next.34

### Minor Changes

- Automatically re-prebundle when Svelte config changed for `experimental.prebundleSvelteLibraries` ([#245](https://github.com/sveltejs/vite-plugin-svelte/pull/245))

### Patch Changes

- use the resolved vite root to support backend integrations ([#247](https://github.com/sveltejs/vite-plugin-svelte/pull/247))

* fix `experimental.useVitePreprocess` option for Vite 2.8 ([#240](https://github.com/sveltejs/vite-plugin-svelte/pull/240))

## 1.0.0-next.33

### Minor Changes

- auto-restart SvelteKit when Svelte config changed ([#237](https://github.com/sveltejs/vite-plugin-svelte/pull/237))

* handle preprocess for prebundleSvelteLibraries ([#229](https://github.com/sveltejs/vite-plugin-svelte/pull/229))

### Patch Changes

- Skip prebundle non-js nested dependencies ([#234](https://github.com/sveltejs/vite-plugin-svelte/pull/234))

* handle production builds for non "production" mode ([#229](https://github.com/sveltejs/vite-plugin-svelte/pull/229))

## 1.0.0-next.32

### Major Changes

- update vite peerDependency to ^2.7.0 and refactor server restart on change of svelte.config.js ([#223](https://github.com/sveltejs/vite-plugin-svelte/pull/223))

### Patch Changes

- Ignore import protocols like `node:` when resolving the `svelte` field in package.json ([#225](https://github.com/sveltejs/vite-plugin-svelte/pull/225))

## 1.0.0-next.31

### Minor Changes

- Improved error reporting for svelte compiler errors ([#220](https://github.com/sveltejs/vite-plugin-svelte/pull/220))

## 1.0.0-next.30

### Major Changes

- Bump svelte peer dependency to ^3.44.0 ([#202](https://github.com/sveltejs/vite-plugin-svelte/pull/202))

## 1.0.0-next.29

### Major Changes

- drop support for node12 ([#198](https://github.com/sveltejs/vite-plugin-svelte/pull/198))

### Minor Changes

- Add `experimental.prebundleSvelteLibraries` option ([#200](https://github.com/sveltejs/vite-plugin-svelte/pull/200))

### Patch Changes

- Disable CSS sourcemap in SSR ([#201](https://github.com/sveltejs/vite-plugin-svelte/pull/201))

## 1.0.0-next.28

### Patch Changes

- Fix emitCss behaviour in a svelte config ([#194](https://github.com/sveltejs/vite-plugin-svelte/pull/194))

## 1.0.0-next.27

### Minor Changes

- Run Vite preprocessors first in markup phase ([#189](https://github.com/sveltejs/vite-plugin-svelte/pull/189))

### Patch Changes

- Handle flexible ssr signature for hooks with ssr argument ([#187](https://github.com/sveltejs/vite-plugin-svelte/pull/187))

## 1.0.0-next.26

### Major Changes

- minimum required version of vite is 2.6.0 ([#182](https://github.com/sveltejs/vite-plugin-svelte/pull/182))

## 1.0.0-next.25

### Minor Changes

- Use transformWithEsbuild for vite script preprocessor ([#173](https://github.com/sveltejs/vite-plugin-svelte/pull/173))

## 1.0.0-next.24

### Patch Changes

- Only add all Svelte dependencies to ssr.noExternal in SSR build ([#169](https://github.com/sveltejs/vite-plugin-svelte/pull/169))

## 1.0.0-next.23

### Patch Changes

- Svelte libraries without any Svelte components are also added to ssr.noExternal ([#166](https://github.com/sveltejs/vite-plugin-svelte/pull/166))

## 1.0.0-next.22

### Patch Changes

- Only optimize nested cjs dependencies ([#163](https://github.com/sveltejs/vite-plugin-svelte/pull/163))

## 1.0.0-next.21

### Minor Changes

- Add option disableDependencyReinclusion to offer users a way out of automatic optimization for hybrid packages ([#161](https://github.com/sveltejs/vite-plugin-svelte/pull/161))

### Patch Changes

- Improve automatic dependency pre-bundling by not reincluding dependencies that are already present in optimizeDeps.exclude ([#159](https://github.com/sveltejs/vite-plugin-svelte/pull/159))

## 1.0.0-next.20

### Major Changes

- Enable optimization for nested dependencies of excluded svelte dependencies ([#157](https://github.com/sveltejs/vite-plugin-svelte/pull/157))

  Vite 2.5.3 and above is needed to support this feature.

### Minor Changes

- Improve dev warning message for components including only unscoped styles (fixes [#153](https://github.com/sveltejs/vite-plugin-svelte/issues/153)) ([#154](https://github.com/sveltejs/vite-plugin-svelte/pull/154))

## 1.0.0-next.19

### Patch Changes

- add automatically excluded svelte dependencies to ssr.noExternal ([#147](https://github.com/sveltejs/vite-plugin-svelte/pull/147))

## 1.0.0-next.18

### Minor Changes

- automatically exclude svelte dependencies in vite.optimizeDeps ([#145](https://github.com/sveltejs/vite-plugin-svelte/pull/145))

### Patch Changes

- use createRequire to load svelte.config.cjs in esm projects (fixes [#141](https://github.com/sveltejs/vite-plugin-svelte/issues/141)) ([#142](https://github.com/sveltejs/vite-plugin-svelte/pull/142))

## 1.0.0-next.17

### Patch Changes

- don't add svelte/ssr to vite.optimizeDeps.include (fixes [#138](https://github.com/sveltejs/vite-plugin-svelte/issues/138)) ([#139](https://github.com/sveltejs/vite-plugin-svelte/pull/139))

## 1.0.0-next.16

### Major Changes

- automatically include svelte in vite config optimizeDeps.include ([#137](https://github.com/sveltejs/vite-plugin-svelte/pull/137))

  Previously, svelte was automatically excluded. We include it now by default to improve deduplication.

  As a result, svelte is pre-bundled by vite during dev, which it logs when starting the devserver

  ```shell
  Pre-bundling dependencies:
    svelte/animate
    svelte/easing
    svelte/internal
    svelte/motion
    svelte/store
    (...and 2 more)
  (this will be run only when your dependencies or config have changed)
  ```

  And it's also visible in the browsers network tab, where requests for svelte imports now start with `node_modules/.vite/` during dev.

  Check out the [vite pre-bundling documentation](https://vitejs.dev/guide/dep-pre-bundling.html) for more information.

  To get the old behavior back, add the following to your vite config

  ```js
  optimizeDeps: {
    exclude: ["svelte"];
  }
  ```

### Patch Changes

- prepare for a change in vite 2.5.0 that would lead to errors in preprocessor dependency handling (fixes [#130](https://github.com/sveltejs/vite-plugin-svelte/issues/130)) ([#131](https://github.com/sveltejs/vite-plugin-svelte/pull/131))

## 1.0.0-next.15

### Major Changes

- change default value of compilerOptions.hydratable to false ([#122](https://github.com/sveltejs/vite-plugin-svelte/pull/122))

  This is done to align with svelte compiler defaults and improve output in non-ssr scenarios.

  Add `{compilerOptions: {hydratable: true}}` to vite-plugin-svelte config if you need hydration (eg. for ssr)

### Minor Changes

- add config option `experimental.dynamicCompileOptions` for finegrained control over compileOptions ([#122](https://github.com/sveltejs/vite-plugin-svelte/pull/122))

### Patch Changes

- resolve vite.root option correctly (fixes [#113](https://github.com/sveltejs/vite-plugin-svelte/issues/113)) ([#115](https://github.com/sveltejs/vite-plugin-svelte/pull/115))

## 1.0.0-next.14

### Patch Changes

- replace querystring with URLSearchParams ([#107](https://github.com/sveltejs/vite-plugin-svelte/pull/107))

* import svelte types instead of duplicating them ([#105](https://github.com/sveltejs/vite-plugin-svelte/pull/105))

- update svelte-hmr to 0.14.7 to fix issue with svelte 3.40 ([#112](https://github.com/sveltejs/vite-plugin-svelte/pull/112))

* turn diff-match-patch into an optional peer dependency to reduce footprint ([#110](https://github.com/sveltejs/vite-plugin-svelte/pull/110))

## 1.0.0-next.13

### Minor Changes

- Add `experimental` section to options and move `useVitePreprocess` there ([#99](https://github.com/sveltejs/vite-plugin-svelte/pull/99))

  Experimental options are not ready for production use and breaking changes to them can occur in any release

  If you already had `useVitePreprocess` enabled, update you config:

  ```diff
  - svelte({useVitePreprocess: true})
  + svelte({experimental: {useVitePreprocess: true}})
  ```

* Add option to ignore svelte preprocessors of other vite plugins ([#98](https://github.com/sveltejs/vite-plugin-svelte/pull/98))

  - ignore them all: `ignorePluginPreprocessors: true`
  - ignore by name: `ignorePluginPreprocessors: ['<name of plugin>',...]`

- Move plugin preprocessor definition to api namespace ([#98](https://github.com/sveltejs/vite-plugin-svelte/pull/98))

  Plugins that provide `myplugin.sveltePreprocess`, should move it to `myplugin.api.sveltePreprocess`, as suggested by [rollup](https://rollupjs.org/guide/en/#direct-plugin-communication)

* Experimental: Generate sourcemaps for preprocessors that lack them ([#101](https://github.com/sveltejs/vite-plugin-svelte/pull/101))

  enable option `experimental.generateMissingPreprocessorSourcemaps` to use it

### Patch Changes

- removed redundant `disableCssHmr` option ([#99](https://github.com/sveltejs/vite-plugin-svelte/pull/99))

  You can use `emitCss: false` or `emitCss: !!isProduction` instead

* further improvements to changelog (see [#93](https://github.com/sveltejs/vite-plugin-svelte/issues/93)) ([#94](https://github.com/sveltejs/vite-plugin-svelte/pull/94))

- reduce log output with log.once function to filter repetetive messages ([#101](https://github.com/sveltejs/vite-plugin-svelte/pull/101))

* remove transitive peer dependency on rollup (fixes [#57](https://github.com/sveltejs/vite-plugin-svelte/issues/57)) ([#103](https://github.com/sveltejs/vite-plugin-svelte/pull/103))

## 1.0.0-next.12

### Minor Changes

- Resolve svelte to svelte/ssr when building for ssr (fixes [#74](https://github.com/sveltejs/vite-plugin-svelte/issues/74)) ([#75](https://github.com/sveltejs/vite-plugin-svelte/pull/75)) ([`f6f56fe`](https://github.com/sveltejs/vite-plugin-svelte/commit/f6f56fee7d3567196052a23440cb1818187fa232))

- Support svg extension ([#78](https://github.com/sveltejs/vite-plugin-svelte/pull/78)) ([`2eb09cf`](https://github.com/sveltejs/vite-plugin-svelte/commit/2eb09cf180c7ebf0fb4ccfccee663e5264b3814c))

- Restart dev server when svelte config file changes ([#72](https://github.com/sveltejs/vite-plugin-svelte/pull/72)) ([`5100376`](https://github.com/sveltejs/vite-plugin-svelte/commit/5100376ef91d5e39ec00222f1043e4fda047678b))

- Allow svelte imports to be added to optimizeDeps.include and don't exclude svelte from optimizeDeps then ([#68](https://github.com/sveltejs/vite-plugin-svelte/pull/68)) ([`9583900`](https://github.com/sveltejs/vite-plugin-svelte/commit/9583900a2b3600133cee3a46b6dbb7df137977b6))

- Vite config can be updated based on values in svelte config (see [#60](https://github.com/sveltejs/vite-plugin-svelte/issues/60)) ([#64](https://github.com/sveltejs/vite-plugin-svelte/pull/64)) ([`c3f65fd`](https://github.com/sveltejs/vite-plugin-svelte/commit/c3f65fdf414b22810ad60817b3e1e62790ba816f))

### Patch Changes

- customize changelog format ([#90](https://github.com/sveltejs/vite-plugin-svelte/pull/90)) ([`b5a58cd`](https://github.com/sveltejs/vite-plugin-svelte/commit/b5a58cd814bbc71a5e59060d436770f7a0102262))

- relax svelte peer dependency to 3.34.0 ([#70](https://github.com/sveltejs/vite-plugin-svelte/pull/70)) ([`377d464`](https://github.com/sveltejs/vite-plugin-svelte/commit/377d464eba30c56f012deba3d306cb5a7195b787))

- do not transform imports tagged with ?url or ?raw (fixes #87) ([#88](https://github.com/sveltejs/vite-plugin-svelte/pull/88)) ([`d1d2638`](https://github.com/sveltejs/vite-plugin-svelte/commit/d1d2638b247830852faa89e7b9bc9a430b81ba51))

- update svelte-hmr to ^0.14.5 to fix hmr reordering issue introduced by a change in svelte 3.38.3 ([#92](https://github.com/sveltejs/vite-plugin-svelte/pull/92)) ([`cdfd821`](https://github.com/sveltejs/vite-plugin-svelte/commit/cdfd8210770150c6e40f68b6b48cd2e455414299))

- fix kit-node tests ([#55](https://github.com/sveltejs/vite-plugin-svelte/pull/55)) ([`09b63d3`](https://github.com/sveltejs/vite-plugin-svelte/commit/09b63d32e8816acc554a66d4d01062be197dfbb7))

- output sourcemap in hmr helper preprocessor ([#71](https://github.com/sveltejs/vite-plugin-svelte/pull/71)) ([`97ee68c`](https://github.com/sveltejs/vite-plugin-svelte/commit/97ee68c5106e58b2e7c4eb97e8cf7dd1c52bbfd3))

- reduced debug output ([#83](https://github.com/sveltejs/vite-plugin-svelte/pull/83)) ([`eb048ff`](https://github.com/sveltejs/vite-plugin-svelte/commit/eb048ff9419488f75869ffb880a78a2a3aa5a6bb))

- Refactored e2e-tests to use package.json scripts

- Updated dependencies

## 1.0.0-next.11

### Major Changes

- convert to es module with cjs fallback, use named export instead of default ([#54](https://github.com/sveltejs/vite-plugin-svelte/pull/54)) ([`0f7e256`](https://github.com/sveltejs/vite-plugin-svelte/commit/0f7e256a9ebb0ee9ac6075146d27bf4f11ecdab3))

  If you are using vite-plugin-svelte with require, you should switch to esm and import the named export "svelte".
  An example can be found in the usage section of the [readme](README.md)

  For existing esm configs update your import to use the new named export.

  ```diff
  - import svelte from '@sveltejs/vite-plugin-svelte';
  + import { svelte } from '@sveltejs/vite-plugin-svelte';
  ```

  continuing with cjs/require is discouraged but if you must use it, update your require statement to use the named export

  ```diff
  - const svelte = require('@sveltejs/vite-plugin-svelte');
  + const { svelte } = require('@sveltejs/vite-plugin-svelte');
  ```

### Minor Changes

- Log svelte compiler warnings to console. use options.onwarn to customize logging ([#45](https://github.com/sveltejs/vite-plugin-svelte/pull/45)) ([`673cf61`](https://github.com/sveltejs/vite-plugin-svelte/commit/673cf61b3800e7a64be2b73a7273909da95729d2))

### Patch Changes

- Update to esbuild 0.12 and vite 2.3.7 ([#44](https://github.com/sveltejs/vite-plugin-svelte/pull/44)) ([`24ae093`](https://github.com/sveltejs/vite-plugin-svelte/commit/24ae0934301cb50506bf39cdccc07ad3eac546fd))

- Update engines.node to "^12.20 || ^14.13.1 || >= 16" ([#44](https://github.com/sveltejs/vite-plugin-svelte/pull/44)) ([`24ae093`](https://github.com/sveltejs/vite-plugin-svelte/commit/24ae0934301cb50506bf39cdccc07ad3eac546fd))

- Enable logging for compiler warnings ([#45](https://github.com/sveltejs/vite-plugin-svelte/pull/45)) ([`673cf61`](https://github.com/sveltejs/vite-plugin-svelte/commit/673cf61b3800e7a64be2b73a7273909da95729d2))

## 1.0.0-next.10

### Minor Changes

- Allow `emitCss: false` for production builds and customizable compilerOptions.css and hydratable (fixes [#9](https://github.com/sveltejs/vite-plugin-svelte/issues/9)) ([#41](https://github.com/sveltejs/vite-plugin-svelte/pull/41)) ([`cb7f03d`](https://github.com/sveltejs/vite-plugin-svelte/commit/cb7f03d61c19f0b98c6412c11bbaa4af978da9ed))

## 1.0.0-next.9

### Patch Changes

- Ensure esm config loading works on windows ([#38](https://github.com/sveltejs/vite-plugin-svelte/pull/38)) ([`5aef91c`](https://github.com/sveltejs/vite-plugin-svelte/commit/5aef91c8752c8de94a1f1fcb28618606b7c44670))

## 1.0.0-next.8

### Minor Changes

- Support esm in svelte.config.js and svelte.config.mjs ([#35](https://github.com/sveltejs/vite-plugin-svelte/pull/35)) ([`4018ce6`](https://github.com/sveltejs/vite-plugin-svelte/commit/4018ce621b4df75877e0e18057c332f27158d42b))

- Add configFile option ([#35](https://github.com/sveltejs/vite-plugin-svelte/pull/35)) ([`4018ce6`](https://github.com/sveltejs/vite-plugin-svelte/commit/4018ce621b4df75877e0e18057c332f27158d42b))

### Patch Changes

- Watch preprocessor dependencies and trigger hmr on change ([#34](https://github.com/sveltejs/vite-plugin-svelte/pull/34)) ([`e5d4749`](https://github.com/sveltejs/vite-plugin-svelte/commit/e5d4749c0850260a295daab9cb15866fe58ee709))

## 1.0.0-next.7

### Minor Changes

- Reduced cache usage, share css cache between SSR and client ([#32](https://github.com/sveltejs/vite-plugin-svelte/pull/32)) ([`113bb7d`](https://github.com/sveltejs/vite-plugin-svelte/commit/113bb7dc330a7517085d12d1d0758a376a12253f))

## 1.0.0-next.6

### Minor Changes

- 1be46f1: improved css hmr
- a0f5a65: Allow other vite plugins to define preprocessors

### Patch Changes

- 8d9ef96: fix: do not preserve types unless useVitePreprocess option is true
- 6f4a253: disable svelte-hmr overlay by default
- 18647aa: improve virtual css module path (fixes #14)

## 1.0.0-next.5

### Patch Changes

- 61439ae: initial release
