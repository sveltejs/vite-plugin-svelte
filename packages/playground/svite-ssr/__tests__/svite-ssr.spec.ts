import {
  editFileAndWaitForHmrComplete,
  getColor,
  getEl,
  getText,
  isBuild,
  untilUpdated
} from '../../testUtils'
import { port } from './serve'
import fetch from 'node-fetch'

const url = `http://localhost:${port}`

test('/', async () => {
  await page.goto(url)

  expect(await page.textContent('h1')).toMatch('Hello svite world') // after hydration

  const html = await (await fetch(url)).text()
  expect(html).toMatch('Hello world') // before hydration
  if (isBuild) {
    // TODO expect preload links
  }
})

test('css', async () => {
  if (isBuild) {
    expect(await getColor('h1')).toBe('green')
  } else {
    // During dev, the CSS is loaded from async chunk and we may have to wait
    // when the test runs concurrently.
    await untilUpdated(() => getColor('h1'), 'green')
  }
})

test('asset', async () => {
  // should have no 404s
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
  const img = await page.$('img')
  expect(await img.getAttribute('src')).toMatch(
    isBuild ? /\/assets\/logo\.\w{8}\.svg/ : '/src/assets/logo.svg'
  )
})

if (!isBuild) {
  describe('hmr', () => {
    const updateApp = editFileAndWaitForHmrComplete.bind(null, 'src/App.svelte')
    test('should render additional html', async () => {
      expect(await getEl('#hmr-test')).toBe(null)
      await updateApp((content) => `${content}\n<div id="hmr-test">foo</div>`)
      await expect(await getText(`#hmr-test`)).toBe('foo')
    })
    test('should apply style update', async () => {
      expect(await getColor(`h1`)).toBe('green')
      await updateApp((content) =>
        content.replace('color: green', 'color: red')
      )
      expect(await getColor(`h1`)).toBe('red')
    })
    test('should not preserve state of updated props', async () => {
      await expect(await getText(`#foo`)).toBe('foo')
      await updateApp((content) =>
        content.replace("foo = 'foo'", "foo = 'bar'")
      )
      await expect(await getText(`#foo`)).toBe('bar')
    })
  })
}
