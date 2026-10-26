<script module>
	export const svelte5 = 'svelte5';
	const svelte5named = 'svelte5named';
	export { svelte5named, svelte5snippet, svelte5snippet as svelte5snippetAlias };
</script>

{#snippet svelte5snippet()}
	svelte5snippet
{/snippet}
