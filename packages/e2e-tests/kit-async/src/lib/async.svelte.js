export async function asyncFoo() {
	const foo = $derived(
		await new Promise((resolve) =>
			setTimeout(() => {
				resolve('foo');
			}, 500)
		)
	);
	return () => foo;
}
