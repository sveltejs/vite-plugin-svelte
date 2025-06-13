<script lang="ts">
	import Foo from './Foo.svelte';
	import Bar from './Bar.svelte';
	export let hello: string;
	const world: string = 'world'; // edit world and save to see hmr update
	enum Baz {
		Qoox = 'qoox'
	}
	let qoox = Baz.Qoox;
</script>

<h1 class="foo">{hello} {world}</h1>
<p id="app-scss">This is styled with scss using darken fn</p>
<Foo />
<Bar />
<p id="enum">{qoox}</p>

<style lang="scss">
	@use 'sass:color';
	$blue: blue;
	p {
		color: color.adjust($blue, $lightness: -20%);
	}
	h1.foo {
		color: $blue; /* change color an save to see hmr update */
	}
</style>
