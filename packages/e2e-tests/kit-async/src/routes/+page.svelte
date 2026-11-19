<script>
	import Counter from '#lib/Counter.svelte';
</script>

<h1>Hello async world!</h1>
<svelte:boundary>
	<Counter />
	{#snippet pending()}
		<p>Wait for it ...</p>
	{/snippet}
</svelte:boundary>
