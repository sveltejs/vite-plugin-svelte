<script>
  const world = 'postcss' // edit world and save to see hmr update
</script>

<h1 class="border border-current rounded p-4 m-4">
  <!-- tailwind classes in svelte template -->
  Hello
  <span class="world">{world}</span>
</h1>

<style>
  h1 {
    color: green; /* change color an save to see hmr update */
    /* you can also use css nesting
    & .world {
      font-size: 2rem;
    }
    */
  }
  .world {
    @apply text-green-500 italic; /*  here's some tailwind apply */
  }
</style>
