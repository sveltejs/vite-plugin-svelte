---
title: Overview
---

When you build an app with [Vite](https://vite.dev/), `@sveltejs/vite-plugin-svelte` teaches it how to transform `.svelte` and `.svelte.js` (or `.svelte.ts`) files:

```js
/// file: vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [
		svelte({
			/* plugin options */
		})
	]
});
```

For details of the plugin options, see [Configuration](configuration).

In addition, the plugin optionally injects the [inspector](inspector) during development, allowing you to click on an element to jump to the corresponding code in your editor.

> [!NOTE] If you're using SvelteKit, you don't need to install `vite-plugin-svelte` directly — it is included on your behalf via the `sveltekit(...)` plugin imported from `@sveltejs/kit/vite`, which forwards configuration to `vite-plugin-svelte`.
