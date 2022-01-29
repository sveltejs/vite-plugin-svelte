<script>
	const label = 'dependency-import';
	import * as cjsOnly from 'e2e-test-dep-cjs-only';
	const { cjs } = cjsOnly;
	import * as cjsOnlyExported from 'e2e-test-dep-cjs-only-exports';
	const { cjs_exported } = cjsOnlyExported;
</script>

<div id="dependency-import"><span class="label">{label}</span></div>
<div id="sticky-dep" class="sticky-dep">sticky-dep</div>
<div id="cjs-only-dependency">{cjs()}</div>
<div id="cjs-only-dependency-exported">{cjs_exported()}</div>

<style>
	.label {
		color: green;
	}
	.sticky-dep {
		position: sticky;
	}
</style>
