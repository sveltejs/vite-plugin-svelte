<script lang="ts">
  let foo: string = 'stylus'
  export let bla: string = 'blub'
</script>

<h1>Styles with {foo} {bla}</h1>
<p class="note">cool, huh?</p>

<style lang="stylus">
  /* prettier-ignore */
  .note
    color #ff3e00
  h1
    color magenta
</style>
