export async function asyncFoo() {
	const foo = $derived(await Promise.resolve('foo'));
	return foo;
}
