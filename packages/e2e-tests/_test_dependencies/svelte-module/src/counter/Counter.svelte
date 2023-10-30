<svelte:options runes />
<script>
  import {createCounter} from "./Counter.svelte.js";
  const counter = createCounter(0);
</script>

<button on:click={counter.increment}>
  count is {counter.count}
</button>
