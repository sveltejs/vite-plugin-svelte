<script>
	import Dependency from 'e2e-test-dep-svelte-simple';
	import Child from './lib/Child.svelte';
</script>

<h1>Hello world!</h1>
<Dependency />
<Child />

<style>
	h1 {
		color: #ff3e00;
	}
</style>
