export function createCounter(n = 0) {
	let count = $state(n);
	return {
		get count() {
			return count;
		},
		increment() {
			count++;
		}
	};
}
