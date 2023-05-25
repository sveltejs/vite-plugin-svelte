/** @type {import('./$types').PageLoad} */
export async function load() {
	if (globalThis?.window) {
		// delay load on client so we can test hydration with playwright
		return new Promise((resolve) =>
			setTimeout(() => {
				resolve({ load_status: 'CLIENT_LOADED' });
			}, 500)
		);
	} else {
		return { load_status: 'SERVER_LOADED' };
	}
}
