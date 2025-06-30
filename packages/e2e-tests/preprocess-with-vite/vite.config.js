import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import MagicString from 'magic-string';
import * as vite from 'vite';
const { rolldownVersion } = vite;

function addListItemTransform(code, filename, value) {
	const index = code.indexOf('</ol>');
	if (index < 0) {
		return;
	}
	const s = new MagicString(code);
	s.prependLeft(index, `<li>${value}</li>\n`);
	return {
		code: s.toString(),
		// rolldown doesn't work with decoded map
		map: s[rolldownVersion ? 'generateMap' : 'generateDecodedMap']({
			hires: 'boundary',
			file: filename,
			includeContent: false
		})
	};
}

function beforePreprocess() {
	return {
		name: 'before-preprocess',
		enforce: 'pre',
		transform: {
			order: 'pre',
			filter: { id: { include: /Preprocess\.svelte/, exclude: /lang\.css$/ } },
			async handler(code, id) {
				return addListItemTransform(
					code,
					id,
					'before svelte preprocessors: vite-plugin (enforce: pre) transform (order: pre)'
				);
			}
		}
	};
}
function afterPreprocess() {
	return {
		name: 'after-preprocess',
		transform: {
			filter: { id: { include: /Preprocess\.svelte/, exclude: /lang\.css$/ } },
			async handler(code, id) {
				return addListItemTransform(
					code,
					id,
					'after svelte preprocessors: vite-plugin (default) transform (default)'
				);
			}
		}
	};
}

function afterCompile() {
	return {
		name: 'after-svelte',
		transform: {
			order: 'post',
			filter: { id: { include: /Preprocess\.svelte/, exclude: /lang\.css$/ } },
			async handler(code, id) {
				return addListItemTransform(
					code,
					id,
					'after svelte compile: vite-plugin (default) transform (order: post)'
				);
			}
		}
	};
}

function apiPreprocessor() {
	return {
		name: 'api-preprocess',
		enforce: 'pre',
		api: {
			sveltePreprocess: {
				markup: ({ content, filename }) =>
					addListItemTransform(
						content,
						filename,
						'vite-plugin-svelte:preprocess: preprocessor from vitePlugin.api.sveltePreproess'
					)
			}
		}
	};
}

export default defineConfig(({ command, mode }) => {
	const isProduction = mode === 'production';
	return {
		plugins: [
			beforePreprocess(),
			apiPreprocessor(),
			svelte({
				preprocess: [
					vitePreprocess({ script: true }),
					{
						markup: ({ content, filename }) =>
							addListItemTransform(
								content,
								filename,
								'vite-plugin-svelte:preprocess: preprocessor from config'
							)
					}
				]
			}),
			afterPreprocess(),
			afterCompile()
		],
		build: {
			minify: isProduction
		}
	};
});
