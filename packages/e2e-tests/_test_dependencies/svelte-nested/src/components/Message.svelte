<script>
	export let id = 'id';
	export let message = '';
	import { cjs_and_esm } from 'e2e-test-dep-cjs-and-esm';
</script>

<div {id}>{message}</div>
<div id="cjs-and-esm">{cjs_and_esm()}</div>
