import { editFile, getColor, isBuild, untilUpdated } from '../../testUtils'
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

/*
test('virtual module', async () => {
  expect(await page.textContent('.virtual')).toMatch('hi')
})

test('hydration', async () => {
  expect(await page.textContent('button')).toMatch('0')
  await page.click('button')
  expect(await page.textContent('button')).toMatch('1')
})

test('hmr', async () => {
  editFile('src/pages/Home.vue', (code) => code.replace('Home', 'changed'))
  await untilUpdated(() => page.textContent('h1'), 'changed')
})

test('client navigation', async () => {
  await page.click('a[href="/about"]')
  await page.waitForTimeout(10)
  expect(await page.textContent('h1')).toMatch('About')
  editFile('src/pages/About.vue', (code) => code.replace('About', 'changed'))
  await untilUpdated(() => page.textContent('h1'), 'changed')
})
*/
