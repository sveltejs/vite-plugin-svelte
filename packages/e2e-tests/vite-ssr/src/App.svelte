<script>
	import Foo from './components/Foo.svelte';
	import logo from './assets/logo.png';

	import { esm } from 'e2e-test-dep-esm-only';
	export let world = 'world'; // edit world and save to see hmr update
	export let foo = 'foo';
</script>

<h1>Hello {world}</h1>
<p>Open App.svelte in your editor and change something to see HMR in action</p>
<Foo />
<img src={logo} alt="logo" width="24" />
<div id="foo">{foo}</div>
<div id="esm">{esm()}</div>
<!-- HMR-TEMPLATE-INJECT -->

<svelte:head>
	<style>
		body {
			background: lightblue;
		}
	</style>
</svelte:head>

<style>
	h1 {
		color: green; /* change color an save to see hmr update */
	}
</style>
