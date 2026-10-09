import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import MagicString from 'magic-string';

// a plugin that transforms `.svelte` code before the svelte plugin runs and
// returns its own sourcemap, just like third-party plugins in the wild do
function pretransformPlugin() {
	return {
		name: 'pretransform',
		transform(code, id) {
			if (!id.includes('App.svelte')) {
				return null;
			}
			const ms = new MagicString(code);
			// inject a line at the very start of the script block
			const insertAt = code.indexOf('<script>') + '<script>'.length;
			ms.appendRight(insertAt, 'let injected = 42;\n');
			return {
				code: ms.toString(),
				map: ms.generateMap()
			};
		}
	};
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [pretransformPlugin(), svelte({})]
});
