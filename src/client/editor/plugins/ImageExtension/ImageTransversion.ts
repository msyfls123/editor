import { defineImportRule, domOverride, sel } from '@lexical/html'
import type { DOMExportOutput, ElementFormatType } from 'lexical'
import { $getState, $setState } from 'lexical'

import { $createImageNode, ImageNode, keyState, sizeState, urlState } from './ImageNode'

export const ImageImportRule = defineImportRule({
  name: '@app/image',
  match: sel.tag('div').attr('data-lexical-image-block', true),
  $import: (ctx, el, $next) => {
    const img = $createImageNode()
    const format = el.style.textAlign
    if (format) {
      img.setFormat(format as ElementFormatType)
    }
    const url = el.getAttribute('data-lexical-image-url')
    if (url) $setState(img, urlState, url)
    const key = el.getAttribute('data-lexical-image-key')
    if (key) $setState(img, keyState, key)
    const imgEl = el.querySelector('img')
    const width = imgEl?.getAttribute('width')
    const height = imgEl?.getAttribute('height')
    if (width && height) {
      $setState(img, sizeState, {
        width: Number(width.match(/\d+/)?.[0]),
        height: Number(height.match(/\d+/)?.[0])
      })
    }
    return [img]
  }
})

export const ImageRenderRule = domOverride([ImageNode], {
  $exportDOM: (node): DOMExportOutput => {
    const url = $getState(node, urlState)
    const key = $getState(node, keyState)
    const size = $getState(node, sizeState)

    const element = document.createElement('div')
    element.setAttribute('data-lexical-image-block', 'true')
    element.setAttribute('data-lexical-image-key', key)
    element.setAttribute('data-lexical-image-url', url)

    const format = node.getFormat()
    if (format) {
      element.style.textAlign = format
    }

    const img = document.createElement('img')
    img.src = url
    img.classList.add('inline-block')
    img.setAttribute('width', `${size.width}px`)
    img.setAttribute('height', `${size.height}px`)
    element.appendChild(img)

    return { element }
  }
})
