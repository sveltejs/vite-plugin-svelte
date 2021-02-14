<script>
  import Child from './Child.svelte';
  import OtherChild from './OtherChild.svelte';
</script>

<style>
  * {
    color: skyblue;
  }
  div {
    display: flex;
    max-width: 600px;
    margin: auto;
  }
  div :global(> *) {
    flex: 1;
  }
</style>

<h1>Page 13</h1>

<p>I am page 01.</p>

<p>I have some children:</p>

<div>
  <Child />
  <OtherChild />
</div>
