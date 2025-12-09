<script>
	export let id = 'id';
	export let message = '';
	import { cjs_and_esm } from 'e2e-test-dep-cjs-and-esm';
	import 'e2e-test-dep-scss-only';
	/*  //TODO: move closing tag back to column zero after sourcemap bug is fixed */
 </script>

<div {id}>{message}</div>
<div id="cjs-and-esm">{cjs_and_esm()}</div>
