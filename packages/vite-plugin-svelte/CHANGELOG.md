# @sveltejs/vite-plugin-svelte

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
  	exclude: ['svelte'];
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
