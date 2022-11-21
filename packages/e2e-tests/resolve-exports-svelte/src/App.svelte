<script>
	import { Dependency } from 'e2e-test-dep-svelte-exports-simple';
	import DeepDependency from 'e2e-test-dep-svelte-exports-simple/Dependency.svelte';
</script>

<div id="index-import">
	<Dependency />
</div>
<div id="deep-import">
	<DeepDependency />
</div>
