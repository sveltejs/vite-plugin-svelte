const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const { chromium } = require('playwright-chromium')
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
  const pkgDir = path.resolve(__dirname, '../packages', pkg)
  if (!fs.existsSync(pkgDir)) {
    throw new Error(`invalid pkg ${pkg}, dir ${pkgDir} not found`)
  }
  await execa('yarn', ['build-bundle'], { stdio: 'inherit', cwd: pkgDir })
}

module.exports = async () => {
  // TODO currently this builds twice when running yarn test
  await buildPackagesUnderTest()

  const browserServer = await chromium.launchServer({
    headless: !process.env.VITE_DEBUG_SERVE,
    args: process.env.CI
      ? ['--no-sandbox', '--disable-setuid-sandbox']
      : undefined
  })

  global.__BROWSER_SERVER__ = browserServer

  await fs.mkdirp(DIR)
  await fs.writeFile(path.join(DIR, 'wsEndpoint'), browserServer.wsEndpoint())
  if (!process.env.VITE_PRESERVE_BUILD_ARTIFACTS) {
    await fs.remove(path.resolve(__dirname, '../temp'))
  } else {
    await fs.remove(
      path.resolve(__dirname, '../temp', isBuildTest ? 'build' : 'serve')
    )
  }
}
