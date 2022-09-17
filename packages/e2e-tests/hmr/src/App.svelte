<script>
	import StaticImport from './components/StaticImport.svelte';
	import Dependency from 'e2e-test-dep-svelte-simple';
	import HmrTest from './components/HmrTest.svelte';
	import PartialHmr from './components/partial-hmr/PartialHmr.svelte';
	const jsTransform = '__JS_TRANSFORM_1__';
	let dynamicImportComponent;
	function importDynamic() {
		import('./components/DynamicImport.svelte').then((m) => (dynamicImportComponent = m.default));
	}
</script>

<h1 id="app-header">Test-App</h1>
<!-- to be transformed into "Hello world!" text -->
<p id="js-transform">{jsTransform}</p>
<!-- to be transformed into "hello-world" class -->
<p id="css-transform">Hello world</p>
<StaticImport />
<Dependency />
{#if !dynamicImportComponent}
	<button id="button-import-dynamic" on:click={importDynamic}>import dynamic component</button>
{:else}
	<svelte:component this={dynamicImportComponent} />
{/if}
<HmrTest id="hmr-test-1" />
<HmrTest id="hmr-test-2" />

<!-- HMR-TEMPLATE-INJECT -->

<PartialHmr />

<style>
	h1 {
		color: #111111;
	}

	:global(#css-transform) {
		color: __CSS_TRANSFORM_1__;
	}
</style>
