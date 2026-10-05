/**
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
function isPlainObject(value) {
	if (!value || typeof value !== 'object') return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

/**
 * merge option objects into a new object, later ones win.
 * Plain objects are merged recursively and never shared with a source, so the result can be mutated.
 * Every other value (arrays, functions, class instances) replaces the previous one as is
 *
 * @param {(Record<string, any> | false | null | undefined)[]} sources
 * @returns {Record<string, any>}
 */
export function merge(...sources) {
	/** @type {Record<string, any>} */
	let result = {};
	for (const source of sources) {
		if (!source) continue;
		const nested = Object.entries(source)
			.filter(([, value]) => isPlainObject(value))
			.map(([key, value]) => [key, merge(isPlainObject(result[key]) && result[key], value)]);
		result = { ...result, ...source, ...Object.fromEntries(nested) };
	}
	return result;
}
