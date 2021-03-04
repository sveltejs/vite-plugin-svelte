<script>
  import Foo from './Foo.svelte'
  const world = 'world' // edit world and save to see hmr update
</script>

<h1 class="m-2">Hello {world}</h1>
<p>Open App.svelte in your editor and change something to see HMR in action</p>
<Foo />

<style>
  h1 {
    @apply text-svelte-500 p-2 bg-green-200;
  }

  /* works */
  @screen sm {
    h1 {
      background-color: rebeccapurple;
    }
  }

  /* does not work */
  /*
    @screen sm {
        h1 {
            @apply text-blue-500;
        }
    }
    */
  /* does not work either */
  /*
    @media (min-width: 640px) {
        h1 {
            @apply text-blue-500;
        }
    }
    */
</style>
