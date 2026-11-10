import { defineImportRule, sel } from '@lexical/html'
import { $createImageNode } from './ImageNode';
import { ElementFormatType } from 'lexical';
export const ImageImportRule = defineImportRule({
  name: '@app/image',
  match: sel.tag('div').attr('data-lexical-image-block', true),
  $import: (ctx, el, $next) => {
    const img = $createImageNode();
    const format = el.style.textAlign
    if (format) {
      img.setFormat(format as ElementFormatType)
    }
    return [img]
  }
})
