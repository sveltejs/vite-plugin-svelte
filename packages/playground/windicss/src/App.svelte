<script>
    import Foo from "./Foo.svelte";
  const world = 'world'; // edit world and save to see hmr update
</script>

<h1 class="m-2">Hello {world}</h1>
<p>Open App.svelte in your editor and change something to see HMR in action</p>
<Foo></Foo>

<style>
    h1 {
        @apply text-svelte-500 p-2 bg-green-200;
    }
    @screen sm {
        h1 {
            background-color: rebeccapurple;
        }
    }
</style>