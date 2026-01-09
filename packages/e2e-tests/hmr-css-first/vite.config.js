import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

/**
 *
 * @param {import('vite').HotUpdateOptions} options
 * @returns {import('vite').HotUpdateOptions}
 */
function patchHotUpdateOptions(options) {
	if (options.modules.length === 0) {
		return options;
	}
	const svelteModule = options.modules.find((m) => m.id.endsWith('.svelte'));
	const cssModule = options.modules.find((m) => m.id.endsWith('?svelte&type=style&lang.css'));

	if (!svelteModule || !cssModule || options.modules.length !== 2) {
		const message =
			'Received unexpected modules array. Expected one svelte module and one style module but got the following modules: ' +
			JSON.stringify(options.modules.map((m) => m.id));
		console.error(message);
		throw new Error(message);
	}

	// Typically, `options.modules` should be arranged in the order of
	// `[svelteModule, cssModule]`. However, when using Astro `client:load`
	// directive, this order is flipped. We want to ensure that the HMR works
	// correctly in such cases.
	//
	// For more details, see the discussion:
	// https://github.com/sveltejs/vite-plugin-svelte/pull/1257#issuecomment-3718790017
	return { ...options, modules: [cssModule, svelteModule] };
}

/**
 * @param {import('vite').Plugin} plugin
 * @returns {import('vite').Plugin}
 */
function patchHotUpdatePlugin(plugin) {
	const original = plugin.hotUpdate.handler;
	return {
		...plugin,
		hotUpdate: {
			...plugin.hotUpdate,
			async handler(options) {
				const updatedOptions = patchHotUpdateOptions(options);
				return await Reflect.apply(original, this, [updatedOptions]);
			}
		}
	};
}

/**
 * @param {import('vite').Plugin[]} plugins
 * @returns {import('vite').Plugin[]}
 */
function patchSveltePlugins(plugins) {
	let patched = false;
	const result = plugins.map((plugin) => {
		if (plugin.name !== 'vite-plugin-svelte:hot-update') {
			return plugin;
		}
		patched = true;
		return patchHotUpdatePlugin(plugin);
	});
	if (!patched) {
		throw new Error("Could not find plugin 'vite-plugin-svelte:hot-update'");
	}
	return result;
}

export default defineConfig(() => {
	return {
		plugins: [patchSveltePlugins(svelte())],
		build: {
			minify: false,
			target: 'esnext'
		},
		server: {
			watch: {
				// During tests we edit the files too fast and sometimes chokidar
				// misses change events, so enforce polling for consistency
				usePolling: true,
				interval: 100
			}
		}
	};
});
