<script>
  import { getStore } from '../stores/hmr-stores';
  export let id;
  const count = getStore(id, 0);
  const label = 'hmr-test';
  function increment() {
    $count++;
  }
</script>

<style>
  .label {
    color: red;
  }
</style>

<div class="hmr-test" {id}><span class="label">{label}</span> <span class="counter increment" on:click={increment}>{$count}</span></div>
