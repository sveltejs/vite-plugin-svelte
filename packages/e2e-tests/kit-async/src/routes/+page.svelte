<script>
	import { asyncFoo } from '#lib/async.svelte.js';

	const foo = await asyncFoo();
</script>

<h1>Hello async world!</h1>
<span>{foo}</span>
