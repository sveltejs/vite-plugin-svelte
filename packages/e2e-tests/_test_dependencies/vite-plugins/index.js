/**
 * Ensure transform flow is not interrupted
 * @returns {import('vite').Plugin[]}
 */
function transformValidation() {
	return [
		{
			name: 'transform-validation:1',
			enforce: 'pre',
			transform(code, id) {
				if (id.endsWith('.svelte')) {
					return code.replace('__JS_TRANSFORM_1__', '__JS_TRANSFORM_2__');
				} else if (id.endsWith('.css')) {
					return code.replace('__CSS_TRANSFORM_1__', '__CSS_TRANSFORM_2__');
				}
			}
		},
		{
			name: 'transform-validation:2',
			transform(code, id) {
				if (id.endsWith('.svelte')) {
					return code.replace('__JS_TRANSFORM_2__', 'Hello world');
				} else if (id.endsWith('.css')) {
					return code.replace('__CSS_TRANSFORM_2__', 'red');
				}
			}
		},
		{
			name: 'transform-validation:3',
			enforce: 'post',
			transform(code, id) {
				if (id.endsWith('.svelte')) {
					return code.replace('__JS_TRANSFORM_3__', 'Hello world');
				}
				// can't handle css here as in build, it would be `export default {}`
			}
		}
	];
}

module.exports.transformValidation = transformValidation;
