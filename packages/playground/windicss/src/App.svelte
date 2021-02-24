<script>
    import Foo from "./Foo.svelte";
  const world = 'world'; // edit world and save to see hmr update
</script>

<style>
  h1 {
    @apply text-green-500;
  }
  @screen sm {
      h1 {
           @apply text-green-500;
      }
  }
</style>

<h1>Hello {world}</h1>
<p>Open App.svelte in your editor and change something to see HMR in action</p>
<Foo></Foo>