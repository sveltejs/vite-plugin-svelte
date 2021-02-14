<script>
  // import './app.css'
  import * as pages from './pages.js';

  let currentCmp;

  const go = (cmp) => () => {
    currentCmp = cmp;
    console.log(currentCmp.name);
  };
</script>

<style>
  :global(body) {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
  }
  nav {
    float: left;
    text-align: center;
    padding: 1em;
    height: 100vh;
    overflow: auto;
    box-sizing: border-box;
  }
  nav a {
    display: block;
  }
  main {
    overflow: auto;
    text-align: center;
  }
  .App {
    text-align: center;
  }
  .App-header {
    background-color: #f9f6f6;
    color: #333;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: calc(10px + 2vmin);
  }
  .App-link {
    color: #ff3e00;
  }
</style>

<nav>
  <h2>This is a huge app</h2>
  {#each Object.entries(pages) as [name, cmp] (cmp)}
    <a class="App-link" href on:click|preventDefault={go(cmp)}>{name.replace('_', ' ')}</a>
  {/each}
</nav>

{#if currentCmp}
  <main>
    <svelte:component this={currentCmp} />
  </main>
{:else}
  <div class="App">
    <header class="App-header">
      <p>
        Edit
        <code>src/App.svelte</code>
        and save to reload (prepare tissues).
      </p>
      <a class="App-link" href="https://svelte.dev" target="_blank" rel="noopener noreferrer">Learn Svelte</a>
    </header>
  </div>
{/if}
