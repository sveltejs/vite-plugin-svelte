<script context="module">
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load() {
		if (globalThis.window) {
			// delay load on client so we can test hydration with playwright
			return new Promise((resolve) =>
				setTimeout(() => {
					resolve({ props: { load_status: 'CLIENT_LOADED' } });
				}, 200)
			);
		} else {
			return { props: { load_status: 'SERVER_LOADED' } };
		}
	}
</script>

<script>
	import { onMount } from 'svelte';
	import { addMessages, init, _ } from 'svelte-i18n';
	// eslint-disable-next-line node/no-missing-import
	import Counter from '$lib/Counter.svelte';
	// eslint-disable-next-line node/no-missing-import
	import Child from '$lib/Child.svelte';
	import { setSomeContext } from 'e2e-test-dep-svelte-api-only';
	export let load_status = 'NOT_LOADED';
	let mount_status = 'BEFORE_MOUNT';
	onMount(async () => {
		const isSSR = (await import('../client-only-module.js')).default;
		console.log(`onMount dynamic imported isSSR: ${isSSR}`);
		mount_status = 'AFTER_MOUNT';
	});
	setSomeContext();
	addMessages('en', { welcome: 'hello' });
	init({
		fallbackLocale: 'en',
		initialLocale: 'en'
	});
</script>

<main>
	<h1>Hello world!</h1>
	<Counter />

	<p>Visit <a href="https://svelte.dev">svelte.dev</a> to learn how to build Svelte apps.</p>

	<div id="before-child">before-child</div>
	<Child testId="test-child" />
	<div id="after-child">after-child</div>
	<div id="load">{load_status}</div>
	<div id="mount">{mount_status}</div>
	<div>{$_('welcome')}</div>
</main>

<!-- HMR-TEMPLATE-INJECT -->
<style>
	:root {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			'Open Sans', 'Helvetica Neue', sans-serif;
	}

	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4rem;
		font-weight: 100;
		line-height: 1.1;
		margin: 4rem auto;
		max-width: 14rem;
	}

	p {
		max-width: 14rem;
		margin: 2rem auto;
		line-height: 1.35;
	}

	@media (min-width: 480px) {
		h1 {
			max-width: none;
		}

		p {
			max-width: none;
		}
	}
</style>
