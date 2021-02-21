const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const { chromium } = require('playwright-core')
const execa = require('execa')

const isBuildTest = !!process.env.VITE_TEST_BUILD

const DIR = path.join(os.tmpdir(), 'jest_playwright_global_setup')

const packagesToBuild = ['vite-plugin-svelte']

const buildPackagesUnderTest = async () => {
  console.log('')
  console.log('building packages')
  for (pkg of packagesToBuild) {
    console.log(`building ${pkg}`)
    await buildPackage(pkg)
    console.log('')
  }
  console.log('building packages done')
  console.log('')
}

const buildPackage = async (pkg) => {
  const pkgDir = path.resolve(__dirname, '..', 'packages', pkg)
  if (!fs.existsSync(pkgDir)) {
    throw new Error(`invalid pkg ${pkg}, dir ${pkgDir} not found`)
  }
  await execa('yarn', ['build-bundle'], { stdio: 'inherit', cwd: pkgDir })
}

const guessChromePath = async () => {
  const locations = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ...[
      process.env['PROGRAMFILES(X86)'],
      process.env.PROGRAMFILES,
      process.env.LOCALAPPDATA
    ]
      .filter((prefix) => prefix != null && prefix.length > 0)
      .map((prefix) => prefix + '\\Google\\Chrome\\Application\\chrome.exe')
  ]
  for (let path of locations) {
    try {
      if (await fs.exists(path)) {
        return path
      }
    } catch (e) {
      //ignore
    }
  }
}

const startPlaywrightServer = async () => {
  const args = [
    '--headless',
    '--disable-gpu',
    '--single-process',
    '--no-zygote',
    '--no-sandbox'
  ]
  if (process.env.CI) {
    args.push('--disable-setuid-sandbox', '--disable-dev-shm-usage')
  }
  const executablePath = process.env.CHROME_BIN || (await guessChromePath())
  if (!executablePath) {
    throw new Error(
      'failed to identify chrome executable path. set CHROME_BIN env variable'
    )
  }
  const browserServer = await chromium.launchServer({
    headless: true,
    executablePath,
    args
  })
  return browserServer
}

module.exports = async () => {
  // TODO currently this builds twice when running yarn test
  await buildPackagesUnderTest()

  const browserServer = await startPlaywrightServer()

  global.__BROWSER_SERVER__ = browserServer

  await fs.mkdirp(DIR)
  await fs.writeFile(path.join(DIR, 'wsEndpoint'), browserServer.wsEndpoint())
  if (!process.env.VITE_PRESERVE_BUILD_ARTIFACTS) {
    await fs.remove(path.resolve(__dirname, '..', 'temp'))
  } else {
    await fs.remove(
      path.resolve(__dirname, '..', 'temp', isBuildTest ? 'build' : 'serve')
    )
  }
}
