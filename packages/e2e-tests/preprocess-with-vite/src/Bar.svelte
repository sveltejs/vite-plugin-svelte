<script>
	import BarChild from './BarChild.svelte';
</script>

<BarChild />

<style>
	/*
		should warn because style tag only contains unscoped styles
		(code smell & affects css hmr)
	*/
	:global(.note) {
		background-color: lightblue;
	}
</style>
