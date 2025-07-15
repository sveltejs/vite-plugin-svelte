export async function asyncUtil() {
	// async derived was added in svelte 5.36.0
	const x = $derived(await 1);
	return { x };
}
