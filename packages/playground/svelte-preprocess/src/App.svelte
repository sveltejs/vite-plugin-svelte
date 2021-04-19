<script lang="ts">
	import logo from './assets/svelte.png';
	import MultiFile from './lib/multifile/MultiFile.svelte';
</script>

<main>
	<img src={logo} alt="Svelte Logo" />
	<MultiFile />
	<span>I'm orangered</span>
</main>

<style>
	span {
		color: orangered;
	}
</style>
