<style>
  .mdsvex-layout {
    border: 1px solid green;
    border-radius: 0.5rem;
    padding: 1rem;
  }
  .mdsvex-layout-slot {
    border: 1px solid blue;
    margin: 1rem;
    padding: 1rem;
  }
</style>

<div class="mdsvex-layout">
  <h2>I'm a mdsvex layout with a green border.</h2>
  <p>The blue bordered box below is the slot where i put my content</p>
  <div class="mdsvex-layout-slot">
    <slot />
  </div>

</div>
