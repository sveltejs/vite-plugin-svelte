import * as path from 'path'
import * as fs from 'fs'
// @ts-ignore
import { repository } from '../../package.json'
// @ts-ignore
import { version as vitePluginSvelteVersion } from '../../../vite-plugin-svelte/package.json'
const templatesPath = 'packages/templates'
const log = console

async function updatePkg(dir: string) {
  try {
    const pkgFile = path.join(dir, 'package.json')
    const pkg = require(pkgFile)
    pkg.name = path.basename(dir)
    pkg.devDependencies[
      '@svitejs/vite-plugin-svelte'
    ] = `^${vitePluginSvelteVersion}`
    fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2))
  } catch (e) {
    log.error('failed to update package.json', e)
    throw e
  }
}

async function addVsCodePluginRecommendation(dir: string) {
  fs.mkdirSync(path.join(dir, '.vscode'))
  // TODO suggest other extensions like windicss
  fs.writeFileSync(
    path.join(dir, '.vscode', 'extensions.json'),
    `{
  "recommendations": ["svelte.svelte-vscode"]
}
`
  )
}

export interface CreateOptions {
  targetDir: string
  template: string
  typescript: boolean
  force: boolean
  debug: boolean
}

export const templates = [
  'minimal',
  'routify-mdsvex',
  'windicss',
  'preprocess-auto'
]

export async function create(options: CreateOptions) {
  let template = options.template

  if (!templates.includes(template)) {
    log.error(
      `invalid template ${template}. Valid: ${JSON.stringify(templates)}`
    )
    return
  }
  if (options.typescript) {
    template = `${template}-ts`
  }
  const targetDir = path.join(
    process.cwd(),
    options.targetDir || `svite-${template.replace('/', '-')}`
  )

  const degit = require('degit')
  const githubRepo = repository.url.match(/github\.com\/(.*).git/)[1]

  const degitPath = `${githubRepo}/${templatesPath}/${template}#main`
  const degitOptions = {
    force: options.force,
    verbose: options.debug,
    mode: 'tar'
  }
  if (options.debug) {
    log.debug(`degit ${degitPath}`, degitOptions)
  }
  const emitter = degit(degitPath, degitOptions)

  emitter.on('info', (info: any) => {
    log.info(info.message)
  })
  emitter.on('warn', (warning: any) => {
    log.warn(warning.message)
  })
  emitter.on('error', (error: any) => {
    log.error(error.message, error)
  })

  await emitter.clone(targetDir)
  await updatePkg(targetDir)
  await addVsCodePluginRecommendation(targetDir)
  log.info(`created ${targetDir}`)
}
