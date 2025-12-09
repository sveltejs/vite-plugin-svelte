<script>
	import { createCounter } from './Counter.svelte.js';
	const counter = createCounter(0);
	let localCounter = $state(0);
	/*  //TODO: move closing tag back to column zero after sourcemap bug is fixed */ </script>

<button onclick={counter.increment}>
	count is {counter.count}
</button>

<button onclick={() => localCounter++}>
	local count is {localCounter}
</button>
