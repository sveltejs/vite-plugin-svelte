import createDeepmerge from '@fastify/deepmerge';

// The CommonJS getter is available on the default export, not as a native ESM named export.
const { isMergeableObject } = createDeepmerge;

const merge = createDeepmerge({
	symbols: true,
	// Arrays are option values: replace them and preserve their identity, including
	// preprocessors. Excluding them from cloning also preserves target-only arrays.
	isMergeableObject: (value) => !Array.isArray(value) && isMergeableObject(value)
});

/**
 * @template T
 * @param {(Partial<T> | undefined)[]} configs
 * @returns T
 */
export function mergeConfigs(...configs) {
	/** @type {Partial<T>} */
	let result = {};
	for (const config of configs.filter((x) => x != null)) {
		result = /** @type {Partial<T>} */ (merge(result, /** @type {Partial<T>} */ (config)));
	}
	return /** @type {T} */ result;
}
