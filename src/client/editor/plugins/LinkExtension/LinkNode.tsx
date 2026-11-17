import { $create, $getNodeByKey, $getState, $setState, createState, DecoratorNode, EditorConfig, LexicalEditor, SerializedLexicalNode, Spread, stringValue } from 'lexical'
import { Link } from 'lucide-react'
import { DecoratorTextNode } from '@lexical/extension';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { LinkDialog } from './LinkDialog';
import { useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type SerializedLindeNode = Spread<{
  $: {
    url: string
    text: string
  }
}, SerializedLexicalNode>

interface LinkNodeComponentProps {
  url: string
  text: string
  nodeKey: string
}

const LinkNodeComponent = ({ url, text, nodeKey }: LinkNodeComponentProps) => {
  const [open, setOpen] = useState(false)
  const [editor] = useLexicalComposerContext()

  const handleSubmit = useCallback(({ url, text }: { url: string, text: string }) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (!node) return
      $setState(node, urlState, url)
      $setState(node, textState, text)
    })
    setOpen(false)
  }, [editor])

  return (
    <Popover>
      <PopoverTrigger>
        <span
          contentEditable={false}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors select-none"
        >
          <Link className="w-3.5 h-3.5 rounded-sm"></Link>
          <span className="font-medium underline">{text || url}</span>
        </span>
      </PopoverTrigger>
      <PopoverContent className="flex flex-row gap-2 w-auto">
        <a
          href={url}
          target="_blank"
          title={url}
          rel="noopener noreferrer"
        ><Button>Open</Button></a>
        <LinkDialog
          url={url}
          text={text}
          open={open}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        >
          <Button variant="outline" onClick={() => setOpen(true)}>Edit</Button>
        </LinkDialog>
      </PopoverContent>
    </Popover>
  )
}

export const textState = createState('text', {
  parse: stringValue()
})

export const urlState = createState('url', {
  parse: stringValue()
})

export class MyLinkNode extends DecoratorTextNode {
  static getType(): string {
    return 'my-link'
  }

  $config() {
    return this.config('my-link', {
      extends: DecoratorTextNode,
      stateConfigs: [
        { stateConfig: textState },
        { stateConfig: urlState },
      ],
    })
  }

  // serialize

  static importJSON(_serializedNode: SerializedLindeNode): MyLinkNode {
    const node = $createMyLinkNode(_serializedNode.$);
    return node
  }

  exportDOM() {
    const url = $getState(this, urlState)
    const text = $getState(this, textState)

    const element = document.createElement('a')
    element.setAttribute('href', url)
    const textNode = document.createTextNode(text || url)
    element.appendChild(textNode)
    return {
      element
    }
  }

  // view

  decorate() {
    return <LinkNodeComponent
      nodeKey={this.getKey()}
      url={$getState(this, urlState)}
      text={$getState(this, textState)}
    />
  }

  updateDOM(): false {
    return false
  }


}

export interface CreateMyLinkProps {
  text?: string
  url: string
}

export function $createMyLinkNode(props: CreateMyLinkProps): MyLinkNode {
  const { text, url } = props
  const node = $create(MyLinkNode)
  if (text) $setState(node, textState, text)
  $setState(node, urlState, url)
  return node
}

export function $isMyLinkNode(node: unknown): node is MyLinkNode {
  return node instanceof MyLinkNode;
}
