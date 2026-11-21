import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import { $create, $createTextNode, $getNodeByKey, $setSlot, EditorConfig, ElementFormatType, ElementNode, isDOMShadowRoot, LexicalEditor, NodeKey } from "lexical";
import {useLexicalSlotRef} from '@lexical/react/useLexicalSlotRef'
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { JSX } from "react/jsx-runtime";
import { $createCodeNode } from "@lexical/code";
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import { Button } from "@/components/ui/button";

interface DiagramComponentProps {
  nodeKey: NodeKey
  format: ElementFormatType
}

const DiagramComponent = ({ nodeKey, format }: DiagramComponentProps) => {
  const [editor] = useLexicalComposerContext()
  const codeRef = useLexicalSlotRef<HTMLDivElement>(editor, nodeKey, 'code')
  return (
    <BlockWithAlignableContents
      nodeKey={nodeKey}
      className={{
        base: "group/diagram-block my-4 p-2 border-2 border-transparent",
        focus: "diagram-focus border-slate-300!",
      }}
      format={format}
    >
      <Tabs>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <Button
            variant="destructive"
            onClick={() => {
              editor.update(() => {
                const node = $getNodeByKey(nodeKey)
                node?.remove()
              })
            }}
          > Delete </Button>
        </div>

        <TabsContent value="code">
          <div ref={codeRef}/>
        </TabsContent>
        <TabsContent value="preview">
          TBD
        </TabsContent>
      </Tabs>


    </BlockWithAlignableContents>
  )
}

export class DiagramNode extends DecoratorBlockNode {
  $config() {
    return this.config('diagram', {
      extends: DecoratorBlockNode,
      slots: [
        'code',
      ]
    })
  }

  static getType(): string {
    return 'diagram'
  }

  decorate(): JSX.Element | null {
    return <DiagramComponent nodeKey={this.getKey()} format={this.getFormat()} />
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.setAttribute('data-lexical-diagram-node', 'true')
    div.contentEditable = "false";
    return div
  }

  updateDOM(): false {
    return false;
  }

}

export class DiagramCodeRootNode extends ElementNode {
  $config() {
    return this.config('diagram-code-root', {
      extends: ElementNode,
    })
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div')
    dom.setAttribute('data-diagram-code-root', 'true')
    return dom
  }

  updateDOM(): false {
    return false
  }

  isShadowRoot(): boolean {
    return true
  }
}

export interface CreateDiagramProps {
  code?: string
}

export function $createDiagramNode({ code }: CreateDiagramProps = {}) {
  const node = $create(DiagramNode)
  const codeRoot = $create(DiagramCodeRootNode)
  const codeNode = $createCodeNode()
  if (code) {
    codeNode.append($createTextNode(code))
  }
  codeRoot.append(codeNode)
  $setSlot(node, 'code', codeRoot)
  return node
}

export function $isImageNode(node: unknown): node is DiagramNode {
  return node instanceof DiagramNode;
}
