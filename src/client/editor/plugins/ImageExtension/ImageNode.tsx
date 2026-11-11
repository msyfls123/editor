import {
  $create,
  type NodeKey,
  ElementFormatType,
  createState,
  stringValue,
} from "lexical";
import { DecoratorBlockNode, SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'

interface ImageCompProps {
  nodeKey: NodeKey;
  format: ElementFormatType | null;
}

type SerializedImageNode = SerializedDecoratorBlockNode & {
  format: string
}

const ImageComp = ({ nodeKey, format }: ImageCompProps) => {
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  return (
    <BlockWithAlignableContents
      nodeKey={nodeKey}
      className={{
        base: "group/image-block",
        focus: "image-focus",
      }}
      format={format}
    >
      <img
        className="inline-block border-2 border-transparent group-[.image-focus]/image-block:border-cyan-500"
        src="https://picsum.photos/192/192"
        width="50px"
        height="50px"
        onClick={(e) => {
          clearSelection();
          setSelected(!isSelected)
          e.preventDefault()
        }}
      />
    </BlockWithAlignableContents>
  );
};

const formatState = createState('format', {
  parse: (value) => stringValue()
})

export class ImageNode extends DecoratorBlockNode {
  static getType(): string {
    return "image";
  }

  $config() {
    return this.config('image', {
      extends: DecoratorBlockNode,
      stateConfigs: [{ stateConfig: formatState }]
    })
  }

  // serialize

  static importJSON(_serializedNode: SerializedImageNode): ImageNode {
    const node = $createImageNode();
    node.setFormat(_serializedNode.format)
    return node
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      format: this.getFormat(),
    }
  }

  exportDOM() {
    const element = document.createElement('div')
    element.setAttribute('data-lexical-image-block', 'true')
    if (this.getFormat()) {
      element.style.textAlign = this.getFormat()
    }
    const img = document.createElement('img')
    img.src = "https://picsum.photos/192/192"
    img.classList.add('inline-block')
    element.appendChild(img)
    return {
      element
    }
  }

  // view

  decorate() {
    return <ImageComp nodeKey={this.getKey()} format={this.getFormat()} />;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.contentEditable = "false";
    return div;
  }

  updateDOM(): false {
    return false;
  }
}

export function $createImageNode(): ImageNode {
  return $create(ImageNode);
}

export function $isImageNode(node: unknown): node is ImageNode {
  return node instanceof ImageNode;
}
