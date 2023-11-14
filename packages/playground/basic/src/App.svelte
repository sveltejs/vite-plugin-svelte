<script>
	import svelteLogo from './assets/svelte.svg';
	import viteLogo from '/vite.svg';
	import Counter from './lib/Counter.svelte';
	import { Counter as ExternalCounter, createCounter } from 'e2e-test-dep-svelte-module';
	const counter = createCounter(0);
</script>

<main>
	<div>
		<a href="https://vitejs.dev" target="_blank" rel="noreferrer">
			<img src={viteLogo} class="logo" alt="Vite Logo" />
		</a>
		<a href="https://svelte.dev" target="_blank" rel="noreferrer">
			<img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
		</a>
	</div>
	<h1>Vite + Svelte</h1>

	<div class="card">
		<div><span>local</span> <Counter /></div>
		<div><span>imported</span> <ExternalCounter /></div>
		<div>
			<span>imported function</span><button on:click={counter.increment}
				>count is {counter.count}</button
			>
		</div>
	</div>

	<p>
		Check out <a href="https://github.com/sveltejs/kit#readme" target="_blank" rel="noreferrer"
			>SvelteKit</a
		>, the official Svelte app framework powered by Vite!
	</p>

	<p class="read-the-docs">Click on the Vite and Svelte logos to learn more</p>
</main>

<style>
	.logo {
		height: 6em;
		padding: 1.5em;
		will-change: filter;
		transition: filter 300ms;
	}
	.logo:hover {
		filter: drop-shadow(0 0 2em #646cffaa);
	}
	.logo.svelte:hover {
		filter: drop-shadow(0 0 2em #ff3e00aa);
	}
	.read-the-docs {
		color: #888;
	}
	.card {
		display: flex;
		gap: 1rem;
	}
	.card > div {
		display: flex;
		flex-direction: column;
	}
</style>
