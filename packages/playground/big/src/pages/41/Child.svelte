<script>
  import GrandChild from './GrandChild.svelte'
  import OtherGrandChild from './OtherGrandChild.svelte'
</script>

<div>
  <h2>Child 41</h2>

  <p>I have kids too:</p>

  <GrandChild />

  <OtherGrandChild />
</div>

<style>
  * {
    color: deeppink;
  }
</style>
