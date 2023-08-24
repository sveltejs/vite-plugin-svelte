<script>
	import Hybrid from 'e2e-test-dep-svelte-hybrid';
	import Simple from 'e2e-test-dep-svelte-simple';
	import { Dependency } from 'e2e-test-dep-svelte-exports-simple';
	import { Message as Nested } from 'e2e-test-dep-svelte-nested';
	import { setSomeContext } from 'e2e-test-dep-svelte-api-only';
	import { getContext } from 'svelte';
	setSomeContext();
	const apiOnlyLoaded = !!getContext('svelte-api-only');
</script>

<main>
	<div id="hybrid">
		<Hybrid />
	</div>
	<div id="simple">
		<Simple />
	</div>
	<div id="nested">
		<Nested id="message" message="nested" />
	</div>
	<div id="api-only">api loaded: {apiOnlyLoaded}</div>
	<div id="exports-simple">
		<Dependency />
	</div>
</main>
