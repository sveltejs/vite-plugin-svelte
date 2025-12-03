<script>
	import * as cjsOnly from 'e2e-test-dep-cjs-only';
	const label = 'dependency-import';
	const { cjs } = cjsOnly;
	// moving the following script close tag to column 0 triggers a bug in svelte sourcemap creation that prevents rolldown optimizer from processing the sourcemap
	// TODO: move it back after fixed in svelte see https://github.com/sveltejs/svelte/pull/17167
</script>

<div id="dependency-import"><span class="label">{label}</span></div>
<div id="sticky-dep" class="sticky-dep">sticky-dep</div>
<div id="cjs-only-dependency">{cjs()}</div>

<style>
	.label {
		color: green;
	}
	.sticky-dep {
		position: sticky;
	}
</style>
