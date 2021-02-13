import App from './App.svelte'

const app = new App({
  target: document.getElementById('svite'),
  hydrate: true,
  props: {
    world: 'svite world'
  }
})

export default app
