<script>
	import Foo from './Foo.svelte';
	const world = 'world'; // edit world and save to see hmr update
</script>

<h1 class="m-2">Hello {world}</h1>
<p>Open App.svelte in your editor and change something to see HMR in action</p>
<Foo />

<style>
	h1 {
		@apply text-svelte-500 p-2 bg-green-200 hover:(bg-blue-400 text-white);
	}
	@screen sm {
		h1 {
			background-color: rebeccapurple;
		}
	}
	@screen sm {
			h1 {
					@apply text-blue-500;
			}
	}
	@media (min-width: 640px) {
			h1 {
					@apply text-blue-500;
			}
	}
</style>
