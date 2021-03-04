<script type="text/javascript">
  // eslint-disable-next-line no-unused-vars
  import Nested from './Nested.svelte'
  export let name = ''
</script>

<!-- prettier-ignore -->
<template type="text/pug">
  h1.note This is the svelte-preproces example - built with svite
  hr
  h1 Hello!
  br
  input(bind:value="{name}")
  br
  Nested("{name}")
</template>

<style type="text/stylus">
  /* prettier-ignore */
  .note
    color #ff3e00
  h1
    color green
</style>
