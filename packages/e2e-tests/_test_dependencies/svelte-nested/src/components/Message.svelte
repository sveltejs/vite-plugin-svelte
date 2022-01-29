<script>
	export let id = 'id';
	export let message = '';
	import { cjs_and_esm } from 'e2e-test-dep-cjs-and-esm';
	// eslint-disable-next-line node/no-missing-import
	import { cjs_and_esm_exported } from 'e2e-test-dep-cjs-and-esm-exports';
	import 'e2e-test-dep-scss-only';
</script>

<div {id}>{message}</div>
<div id="cjs-and-esm">{cjs_and_esm()}</div>
<div id="cjs-and-esm-exported">{cjs_and_esm_exported()}</div>
