<script>
  import { url } from '@roxi/routify'
</script>

<div id="app">
  <nav>
    <a href="/mdsvex" use:$url>mdsvex</a>
  </nav>
  <main>
    <slot />
  </main>
  <footer>footer</footer>
</div>

<style>
  #app {
    display: grid;
    min-height: 100vh;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: max-content 1fr auto;
    grid-gap: 1rem;
  }
  nav {
    display: flex;
    justify-content: space-around;
    padding: 1rem;
    border-bottom: 1px solid orangered;
  }
  main {
    margin: 0 auto;
    max-width: 1280px;
  }
  footer {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
    border-top: 1px solid gray;
  }
</style>
