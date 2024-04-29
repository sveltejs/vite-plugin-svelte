<script>
	import { createCounter } from './Counter.svelte.js';
	const counter = createCounter(0);
	let localCounter = $state(0);
</script>

<button onclick={counter.increment}>
	count is {counter.count}
</button>

<button onclick={() => localCounter++}>
	local count is {localCounter}
</button>
