import { cac } from 'cac'
// @ts-ignore
import { version } from '../../package.json'
import { create, CreateOptions, templates } from './create'

const cli = cac('svite')

cli
  .command(
    'create [targetDir]',
    'create a new project. If you do not specify targetDir, "./svite-<template>" will be used'
  )

  .option(
    '--t, --template <string>',
    `template for new project. ${JSON.stringify(templates)}`,
    { default: templates[0] }
  )
  .option('--ts, --typescript', 'enable typescript support for svelte', {
    default: false
  })
  .option(
    '-f, --force',
    'force operation even if targetDir exists and is not empty',
    { default: false }
  )
  .option('-d, --debug', 'more verbose logging', { default: false })
  .action(async (targetDir, options: CreateOptions) => {
    options.targetDir = targetDir
    await create(options)
  })

cli.help()
cli.version(version)
cli.parse(process.argv, { run: false })
async function main() {
  if (cli.matchedCommand) {
    await cli.runMatchedCommand()
  } else {
    cli.outputHelp()
  }
}
main().catch((e) => {
  console.error('create failed', e)
  process.exit(1)
})
