<script>
	import asset from '/src/assets/static.png';
	const importedAsset = asset;
	const label = 'static-import';
</script>

<div id="static-import">
	<span class="label">{label}</span> <img alt="imported" src={importedAsset} />
</div>

<!-- HMR-TEMPLATE-INJECT -->
<style>
	.label {
		padding-left: 2rem;
		background-image: url('/src/assets/static.png');
		background-repeat: no-repeat;
		background-size: contain;
	}
	img {
		width: 1rem;
		height: 1rem;
	}
</style>
