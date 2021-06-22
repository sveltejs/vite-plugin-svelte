import { writable } from 'svelte/store';
let stores = {};

export function getStore(id, initialValue) {
	return stores[id] || (stores[id] = writable(initialValue));
}

if (import.meta.hot) {
	if (import.meta.hot.data.stores) {
		stores = import.meta.hot.data.stores;
	}
	import.meta.hot.accept();
	import.meta.hot.dispose(() => {
		import.meta.hot.data.stores = stores;
	});
}
