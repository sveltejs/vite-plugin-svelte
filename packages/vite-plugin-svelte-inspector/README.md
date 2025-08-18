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

Now simply press `alt-x` on a page served by the vite devserver to activate inspect mode and click to open the file in your editor.

Also check out the [docs](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/inspector.md) for customization options.

## License

[MIT](./LICENSE)
