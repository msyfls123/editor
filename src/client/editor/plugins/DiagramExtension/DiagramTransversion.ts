import { defineImportRule, domOverride, sel } from '@lexical/html'
import type { DOMExportOutput, ElementFormatType } from 'lexical'
import { $getSlot } from 'lexical'

import { $createDiagramNode, DiagramNode } from './DiagramNode'

const SOURCE_ATTRIBUTE = 'data-render-source'

/** Reads the Mermaid source from either the new protocol or legacy markup. */
function readDiagramSource(element: Element): string {
  const template = element.querySelector<HTMLTemplateElement>(
    `template[${SOURCE_ATTRIBUTE}]`,
  )
  if (template) {
    return template.content.textContent ?? ''
  }

  const source = element.querySelector<HTMLElement>(`[${SOURCE_ATTRIBUTE}]`)
  if (source) {
    return source.textContent ?? ''
  }

  return (
    element.getAttribute('data-lexical-diagram-code') ??
    element.querySelector('pre code')?.textContent ??
    element.querySelector('pre')?.textContent ??
    element.textContent ??
    ''
  )
}

export const DiagramImportRule = defineImportRule({
  name: '@app/diagram',
  match: sel.tag('div').attr('data-lexical-component', 'diagram'),
  $import: (ctx, el, $next) => {
    const diagram = $createDiagramNode({ code: readDiagramSource(el) })

    const format = el.style.textAlign
    if (format) {
      diagram.setFormat(format as ElementFormatType)
    }

    return [diagram]
  },
})

/** Keeps HTML exported by the previous `data-lexical-diagram-block` protocol importable. */
export const LegacyDiagramImportRule = defineImportRule({
  name: '@app/diagram-legacy',
  match: sel.tag('div').attr('data-lexical-diagram-block', true),
  $import: (ctx, el, $next) => {
    const diagram = $createDiagramNode({ code: readDiagramSource(el) })

    const format = el.style.textAlign
    if (format) {
      diagram.setFormat(format as ElementFormatType)
    }

    return [diagram]
  },
})

/**
 * Exports a renderer-agnostic placeholder. The browser hydrates
 * `[data-lexical-component="diagram"]` elements asynchronously with Pele, so
 * static HTML never has to load a diagram engine up front.
 */
export const DiagramRenderRule = domOverride([DiagramNode], {
  $exportDOM: (node): DOMExportOutput => {
    const source = $getSlot(node, 'code')?.getTextContent() ?? ''

    const wrapper = document.createElement('div')
    wrapper.setAttribute('data-lexical-component', 'diagram')
    wrapper.setAttribute('data-lexical-renderer', 'pele')
    wrapper.setAttribute('data-render-status', 'pending')
    wrapper.setAttribute('data-diagram-type', 'mermaid')

    const format = node.getFormat()
    if (format) {
      wrapper.style.textAlign = format
    }

    // `<template>` keeps the source out of rendering and layout.
    const template = document.createElement('template')
    template.setAttribute(SOURCE_ATTRIBUTE, '')
    template.content.textContent = source

    const output = document.createElement('div')
    output.setAttribute('data-render-output', '')
    output.setAttribute('aria-label', 'Mermaid diagram')

    wrapper.appendChild(template)
    wrapper.appendChild(output)

    return { element: wrapper }
  },
})
