import App from './App.svelte'

export async function render(url, manifest) {
  return App.render({
    name: 'world'
  })
}
