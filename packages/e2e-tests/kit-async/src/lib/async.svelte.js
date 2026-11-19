/**
 * @param {() => number} get_count
 */
export async function async_doubled(get_count) {
	const doubled = $derived(await delayed(get_count() * 2));

	return {
		get current() {
			return doubled;
		}
	};
}

/**
 * @template T
 * @param {T} value
 * @returns {Promise<T>}
 */
function delayed(value) {
	return new Promise((resolve) => setTimeout(() => resolve(value), 100));
}
