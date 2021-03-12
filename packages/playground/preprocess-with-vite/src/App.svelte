<script lang="ts">
  import Foo from './Foo.svelte'
  const world: string = 'world' // edit world and save to see hmr update
</script>

<h1 class="foo">Hello {world}</h1>
<p>This is styled with scss using darken fn</p>
<Foo />

<style lang="scss">
  $blue: blue;
  p {
    color: darken($blue, 20);
  }
  h1.foo {
    color: $blue; /* change color an save to see hmr update */
  }
</style>
