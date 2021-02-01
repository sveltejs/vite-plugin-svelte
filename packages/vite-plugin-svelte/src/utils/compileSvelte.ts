import { CompileOptions, Options } from '../index'
import { compile, preprocess, walk } from 'svelte/compiler'
// @ts-ignore
import { createMakeHot } from 'svelte-hmr'

const makeHot = createMakeHot({ walk })
export async function compileSvelte(
  filename: string,
  code: string,
  compilerOptions: CompileOptions,
  rest: Partial<Options>,
  ssr: boolean
) {
  const { onwarn, emitCss = true } = rest
  const dependencies = []

  const svelte_options: CompileOptions = {
    ...compilerOptions,
    filename,
    generate: ssr ? 'ssr' : 'dom'
  }

  if (rest.preprocess) {
    const processed = await preprocess(code, rest.preprocess, { filename })
    if (processed.dependencies) dependencies.push(...processed.dependencies)
    if (processed.map) svelte_options.sourcemap = processed.map
    code = processed.code
  }

  const compiled = compile(code, svelte_options)

  ;(compiled.warnings || []).forEach((warning) => {
    if (!emitCss && warning.code === 'css-unused-selector') return
    // TODO handle warnings
    if (onwarn) onwarn(warning /*, this.warn*/)
    //else this.warn(warning)
  })

  if (emitCss && compiled.css.code) {
    const cssImport = `${filename}?svelte&type=style`
    compiled.js.code += `\nimport ${JSON.stringify(cssImport)};\n`
  }

  if (rest.hot) {
    compiled.js.code = makeHot({
      filename,
      compiledCode: compiled.js.code,
      hotOptions: {
        injectCss: !rest.emitCss,
        ...rest.hot
      },
      compiled,
      originalCode: code,
      compileOptions: svelte_options
    })
  }

  compiled.js.dependencies = dependencies
  return {
    js: compiled.js,
    css: compiled.css,
    warnings: compiled.warnings,
    vars: compiled.vars,
    compilerOptions: svelte_options
  }
}
