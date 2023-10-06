# Preprocess

`vite-plugin-svelte` also exports Vite preprocessors to preprocess Svelte components using Vite's built-in transformers.

Compared to [`svelte-preprocess`](https://github.com/sveltejs/svelte-preprocess), Vite preprocessors share the same CSS configuration from the Vite config so you don't have to configure them twice. [`esbuild`](http://esbuild.github.io) is also used to transform TypeScript by default.

However, `svelte-preprocess` does provide extra functionalities not available with Vite preprocessors, such as [template tag](https://github.com/sveltejs/svelte-preprocess#template-tag), [external files](https://github.com/sveltejs/svelte-preprocess#external-files), and [global styles](https://github.com/sveltejs/svelte-preprocess#global-style) ([though it's recommended to use import instead](./faq.md#where-should-i-put-my-global-styles)). If those features are required, you can still use `svelte-preprocess`, but make sure to turn off it's script and style preprocessing options.

## vitePreprocess

- **Type:** `{ script?: boolean, style?: boolean | InlineConfig | ResolvedConfig }`
- **Default:** `{ script: true, style: true }`

  A Svelte preprocessor that supports transforming TypeScript, PostCSS, SCSS, Less, Stylus, and SugarSS. These are transformed when the script or style tags have the respective `lang` attribute.

  - TypeScript: `<script lang="ts">`
  - SCSS: `<style lang="scss">`
  - Less: `<style lang="less">`
  - Stylus: `<style lang="stylus">`
  - SugarSS: `<style lang="sss">`

  By default, PostCSS or LightningCSS ([if configured in Vite](https://vitejs.dev/config/shared-options.html#css-transformer)) is applied to all `<style>` tags.

  If required, you can turn script or style transforming off by setting the `script` or `style` option to `false`. The `style` option also accepts Vite's `InlineConfig` and `ResolvedConfig` types for advanced usage.

  **Example:**

  ```js
  // svelte.config.js
  import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

  export default {
    preprocess: [vitePreprocess()]
  };
  ```
