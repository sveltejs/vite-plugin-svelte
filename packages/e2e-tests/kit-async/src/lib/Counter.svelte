<script>
	import { async_doubled } from '#lib/async.svelte.js';

	let count = $state(1);

	const doubled = await async_doubled(() => count);
</script>

<button onclick={() => (count += 1)}>increment</button>
<span>{doubled.current}</span>
