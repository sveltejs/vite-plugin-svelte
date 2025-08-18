# @sveltejs/vite-plugin-svelte-inspector

A [Svelte](https://svelte.dev) inspector plugin for [Vite](https://vitejs.dev).

## Usage

This plugin is automatically installed as a dependency of [@sveltejs/vite-plugin-svelte](https://www.npmjs.com/package/@sveltejs/vite-plugin-svelte).

You can enable it in `svelte.config.js` by adding the `vitePlugin.inspector` option.

```js
// svelte.config.js
export default {
  vitePlugin: {
    inspector: true
  }
};
```

Now simply press `alt-x` (`option-x` on MacOS) on a page served by the Vite dev server to activate inspect mode. Click on a highlighted element to jump to its source code in your editor.

Also check out the [docs](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/inspector.md) for customization options.

## License

[MIT](./LICENSE)
