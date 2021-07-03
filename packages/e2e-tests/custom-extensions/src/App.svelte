<script>
	import TestSvg from './components/TestSvg.svg';
</script>

<main>
	<p>
		Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte
		apps.
	</p>
	<TestSvg />
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
