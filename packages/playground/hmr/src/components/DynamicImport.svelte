<script>
  // eslint-disable-next-line node/no-missing-import
  import asset from '/src/assets/dynamic.svg'
  const importedAsset = asset
  const label = 'dynamic-import'
</script>

<div id="dynamic-import">
  <span class="label">{label}</span> <img alt="imported" src={importedAsset} />
</div>

<style>
  .label {
    padding-left: 2rem;
    background-image: url('/src/assets/dynamic.svg');
    background-repeat: no-repeat;
    background-size: contain;
  }
  img {
    width: 1rem;
    height: 1rem;
  }
</style>
