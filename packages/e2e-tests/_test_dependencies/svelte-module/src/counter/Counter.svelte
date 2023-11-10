<script>
	import { createCounter } from './Counter.svelte.js';
	const counter = createCounter(0);
	let localCounter = $state(0);
</script>

<button on:click={counter.increment}>
	count is {counter.count}
</button>

<button on:click={() => localCounter++}>
	local count is {localCounter}
</button>
