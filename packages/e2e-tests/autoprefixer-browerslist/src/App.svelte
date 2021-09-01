<script>
	import Dependency from 'e2e-test-dep-svelte-simple';
</script>

<div class="sticky" id="#sticky">sticky-div</div>
<Dependency />

<style>
	.sticky {
		position: sticky;
	}
</style>
