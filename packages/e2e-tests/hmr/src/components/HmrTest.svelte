<script>
	import { getStore } from '../stores/hmr-stores';
	export let id;
	const count = getStore(id, 0);
	const label = 'hmr-test';
	function increment() {
		$count++;
	}
</script>

<div class="hmr-test" {id}>
	<span class="label">{label}</span>
	<button class="counter increment" on:click={increment}>{$count}</button>
</div>

<!-- HMR-TEMPLATE-INJECT -->
<style>
	.label {
		color: red;
	}
</style>
