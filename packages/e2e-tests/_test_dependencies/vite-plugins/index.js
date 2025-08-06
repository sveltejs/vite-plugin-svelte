import path from 'node:path';
import fs from 'node:fs';
import MagicString from 'magic-string';

function replaceWithSourceMap(code, value, replacement) {
	const s = new MagicString(code);
	s.replaceAll(value, replacement);
	return {
		code: s.toString(),
		map: s.generateMap({ hires: 'boundary' })
	};
}
/**
 * Ensure transform flow is not interrupted
 * @returns {import('vite').Plugin[]}
 */
export function transformValidation() {
	return [
		{
			name: 'transform-validation:1',
			enforce: 'pre',
			transform(code, id) {
				if (id.endsWith('.svelte')) {
					return replaceWithSourceMap(code, '__JS_TRANSFORM_1__', '__JS_TRANSFORM_2__');
				} else if (id.endsWith('.css')) {
					return replaceWithSourceMap(code, '__CSS_TRANSFORM_1__', '__CSS_TRANSFORM_2__');
				}
			}
		},
		{
			name: 'transform-validation:2',
			transform(code, id) {
				if (id.endsWith('.svelte')) {
					return replaceWithSourceMap(code, '__JS_TRANSFORM_2__', '__JS_TRANSFORM_3__');
				} else if (id.endsWith('.css')) {
					return replaceWithSourceMap(code, '__CSS_TRANSFORM_2__', 'red');
				}
			}
		},
		{
			name: 'transform-validation:3',
			enforce: 'post',
			transform(code, id) {
				if (id.endsWith('.svelte')) {
					replaceWithSourceMap(code, '__JS_TRANSFORM_3__', 'Hello world');
				}
				// can't handle css here as in build, it would be `export default {}`
			}
		}
	];
}

/**
 * write resolved config
 * @returns {import('vite').Plugin}
 */
export function writeResolvedConfig() {
	let cmd;
	return {
		name: 'writeResolvedConfig',
		enforce: 'post',
		config(_, { command }) {
			cmd = command;
		},
		configResolved(config) {
			function replacer(key, value) {
				if (value instanceof RegExp) return value.toString();
				else return value;
			}
			const serializableConfig = {
				...config,
				plugins: config.plugins.map((p) => p.name)
			};
			const dir = path.join(config.root, 'logs', 'resolved-configs');
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			const filename = path.join(dir, `vite.config.${cmd}${config.build.ssr ? '.ssr' : ''}.json`);
			fs.writeFileSync(filename, JSON.stringify(serializableConfig, replacer, '\t'), 'utf-8');
		}
	};
}
