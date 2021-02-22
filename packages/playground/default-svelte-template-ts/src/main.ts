import App from './App.svelte'

const app = new App({
  target: document.body,
  props: {
    name: 'world',
    foo: 2
  }
})

export default app
