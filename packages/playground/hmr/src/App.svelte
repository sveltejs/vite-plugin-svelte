<script>
  import StaticImport from './components/StaticImport.svelte';
  import Dependency from '@dependency/dependency';
  import HmrTest from './components/HmrTest.svelte';
  let dynamicImportComponent;
  function importDynamic() {
    import('./components/DynamicImport.svelte').then((m) => (dynamicImportComponent = m.default));
  }
</script>

<style>
  h1 {
    color: #111111;
  }
</style>

<h1 id="app-header">Test-App</h1>
<StaticImport />
<Dependency />
{#if !dynamicImportComponent}
  <button id="button-import-dynamic" on:click={importDynamic}>import dynamic component</button>
{:else}
  <svelte:component this={dynamicImportComponent} />
{/if}
<HmrTest id="hmr-test-1" />
<HmrTest id="hmr-test-2" />
