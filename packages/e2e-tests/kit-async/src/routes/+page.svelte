<script>
	import { asyncFoo } from '$lib/async.svelte.js';
</script>

<h1>Hello async world!</h1>
<span>
	<svelte:boundary>
		{(await asyncFoo())()}
		{#snippet pending()}
			Wait for it ...
		{/snippet}
	</svelte:boundary>
</span>
