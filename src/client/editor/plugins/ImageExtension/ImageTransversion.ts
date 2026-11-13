import { defineImportRule, sel } from '@lexical/html'
import { $createImageNode, keyState, sizeState, urlState } from './ImageNode';
import { $setState, ElementFormatType } from 'lexical';
export const ImageImportRule = defineImportRule({
  name: '@app/image',
  match: sel.tag('div').attr('data-lexical-image-block', true),
  $import: (ctx, el, $next) => {
    const img = $createImageNode();
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
