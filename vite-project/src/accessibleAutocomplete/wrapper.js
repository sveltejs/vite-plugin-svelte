import { createElement, render } from 'preact' /** @jsx createElement */
import Autocomplete from './autocomplete'

function accessibleAutocomplete (options) {
  if (!options.element) { throw new Error('element is not defined') }
  if (!options.id) { throw new Error('id is not defined') }
  if (!options.source) { throw new Error('source is not defined') }
  if (Array.isArray(options.source)) {
    options.source = createSimpleEngine(options.source)
  }
  render(<Autocomplete {...options} />, options.element)
}

const createSimpleEngine = (values) => (query, syncResults) => {
  var matches = values.filter(r => r.toLowerCase().indexOf(query.toLowerCase()) !== -1)
  syncResults(matches)
}

accessibleAutocomplete.enhanceSelectElement = (configurationOptions) => {
  if (!configurationOptions.selectElement) { throw new Error('selectElement is not defined') }

  // Set defaults.
  if (!configurationOptions.source) {
    let availableOptions = [].filter.call(configurationOptions.selectElement.options, option => (option.value || configurationOptions.preserveNullOptions))
    configurationOptions.source = availableOptions.map(option => option.textContent || option.innerText)
  }
  configurationOptions.onConfirm = configurationOptions.onConfirm || (query => {
    const requestedOption = [].filter.call(configurationOptions.selectElement.options, option => (option.textContent || option.innerText) === query)[0]
    if (requestedOption) { requestedOption.selected = true }
  })

  if (configurationOptions.selectElement.value || configurationOptions.defaultValue === undefined) {
    const option = configurationOptions.selectElement.options[configurationOptions.selectElement.options.selectedIndex]
    configurationOptions.defaultValue = option.textContent || option.innerText
  }

  if (configurationOptions.name === undefined) configurationOptions.name = ''
  if (configurationOptions.id === undefined) {
    if (configurationOptions.selectElement.id === undefined) {
      configurationOptions.id = ''
    } else {
      configurationOptions.id = configurationOptions.selectElement.id
    }
  }
  if (configurationOptions.autoselect === undefined) configurationOptions.autoselect = true

  const element = document.createElement('div')

  configurationOptions.selectElement.parentNode.insertBefore(element, configurationOptions.selectElement)

  accessibleAutocomplete({
    ...configurationOptions,
    element: element
  })

  configurationOptions.selectElement.style.display = 'none'
  configurationOptions.selectElement.id = configurationOptions.selectElement.id + '-select'
}

export default accessibleAutocomplete
