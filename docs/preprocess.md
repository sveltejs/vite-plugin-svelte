# Preprocess

`@sveltejs/vite-plugin-svelte/preprocess` exports utilities to preprocess Svelte components using Vite's built-in transformers.

Compared to [`svelte-preprocess`](https://github.com/sveltejs/svelte-preprocess), Vite preprocessors shares the same CSS configuration from the Vite config so you don't have to configure them twice. [`esbuild`](http://esbuild.github.io) is also used to transform TypeScript by default.

## vitePreprocess

- **Type:** `{ script?: boolean, style?: boolean | InlineConfig | ResolvedConfig }`
- **Default:** `{ script: true, style: true }`

  A Svelte preprocessor that supports transforming TypeScript, PostCSS, SCSS, Less, Stylus, and SugarSS. These are transformed when the script or style tags have the respective `lang` attribute.

  - TypeScript: `<script lang="ts">`
  - PostCSS: `<style lang="postcss">`
  - SCSS: `<style lang="scss">`
  - Less: `<style lang="less">`
  - Stylus: `<style lang="stylus">`
  - SugarSS: `<style lang="sss">`

  If required, you can turn script or style transforming off by setting the `script` or `style` option to `false`. The `style` option also accepts Vite's `InlineConfig` and `ResolvedConfig` types for advanced usage.

  **Example:**

  ```js
  // svelte.config.js
  import { vitePreprocess } from '@sveltejs/vite-plugin-svelte/preprocess';

  export default {
    preprocess: [vitePreprocess()]
  };
  ```
