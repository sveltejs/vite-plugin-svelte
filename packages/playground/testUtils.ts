// test utils used in e2e tests for playgrounds.
// this can be directly imported in any playground tests as 'testUtils', e.g.
// `import { getColor } from 'testUtils'`

import fs from 'fs'
import path from 'path'
import slash from 'slash'
import colors from 'css-color-names'
import { ElementHandle } from 'playwright-core'

export const isBuild = !!process.env.VITE_TEST_BUILD

const testPath = expect.getState().testPath
const testName = slash(testPath).match(/playground\/([\w-]+)\//)?.[1]
export const testDir = path.resolve(
  __dirname,
  '../../temp',
  isBuild ? 'build' : 'serve',
  testName
)

const hexToNameMap: Record<string, string> = {}
Object.keys(colors).forEach((color) => {
  hexToNameMap[colors[color]] = color
})

function componentToHex(c: number): string {
  const hex = c.toString(16)
  return hex.length == 1 ? '0' + hex : hex
}

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (match) {
    const [_, rs, gs, bs] = match
    return (
      '#' +
      componentToHex(parseInt(rs, 10)) +
      componentToHex(parseInt(gs, 10)) +
      componentToHex(parseInt(bs, 10))
    )
  } else {
    return '#000000'
  }
}

const timeout = (n: number) => new Promise((r) => setTimeout(r, n))

async function toEl(el: string | ElementHandle): Promise<ElementHandle> {
  if (typeof el === 'string') {
    return await page.$(el)
  }
  return el
}

export async function getColor(el: string | ElementHandle) {
  el = await toEl(el)
  const rgb = await el.evaluate((el) => getComputedStyle(el as Element).color)
  return hexToNameMap[rgbToHex(rgb)] || rgb
}

export async function getBg(el: string | ElementHandle) {
  el = await toEl(el)
  return el.evaluate((el) => getComputedStyle(el as Element).backgroundImage)
}

export function editFile(filename: string, replacer: (str: string) => string) {
  if (isBuild) return
  filename = path.resolve(testDir, filename)
  const content = fs.readFileSync(filename, 'utf-8')
  const modified = replacer(content)
  fs.writeFileSync(filename, modified)
  return modified
}

export function addFile(filename: string, content: string) {
  fs.writeFileSync(path.resolve(testDir, filename), content)
}

export function removeFile(filename: string) {
  fs.unlinkSync(path.resolve(testDir, filename))
}

export function findAssetFile(match: string | RegExp, base = '') {
  const assetsDir = path.join(testDir, 'dist', base, 'assets')
  const files = fs.readdirSync(assetsDir)
  const file = files.find((file) => {
    return file.match(match)
  })
  return file ? fs.readFileSync(path.resolve(assetsDir, file), 'utf-8') : ''
}

/**
 * Poll a getter until the value it returns includes the expected value.
 */
export async function untilUpdated(
  poll: () => string | Promise<string>,
  expected: string
) {
  if (isBuild) return
  const maxTries = process.env.CI ? 100 : 20
  for (let tries = 0; tries < maxTries; tries++) {
    const actual = (await poll()) || ''
    if (actual.indexOf(expected) > -1 || tries === maxTries - 1) {
      expect(actual).toMatch(expected)
      break
    } else {
      await timeout(50)
    }
  }
}

export async function sleep(n: number) {
  return timeout(n)
}

export async function getEl(selector: string) {
  return toEl(selector)
}

export async function getText(el: string | ElementHandle) {
  el = await toEl(el)
  return el ? await el.evaluate((el) => el.textContent) : null
}

export async function hmrUpdateComplete(file, timeout) {
  return new Promise(function (resolve, reject) {
    function listener(data) {
      const text = data.text()
      if (text.indexOf(file) > -1) {
        clearTimeout(timer)
        page.off('console', listener)
        resolve(file)
      }
    }

    page.on('console', listener)
    const timer = setTimeout(function () {
      page.off('console', listener)
      reject(
        new Error(
          `timeout after ${timeout}ms waiting for hmr update of ${file} to complete`
        )
      )
    }, timeout)
  })
}

export async function editFileAndWaitForHmrComplete(file, replacer) {
  const newContent = await editFile(file, replacer)
  try {
    await hmrUpdateComplete(file, 10000)
  } catch (e) {
    console.log(`retrying hmr update for ${file}`)
    await editFile(file, () => newContent)
    await hmrUpdateComplete(file, 5000)
  }
}
