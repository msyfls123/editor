import {
  $create,
  type NodeKey,
  ElementFormatType,
  createState,
  stringValue,
  $setState,
  $getState,
  objectValue,
  numberValue,
} from "lexical";
import { DecoratorBlockNode, SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'

interface ImageCompProps {
  nodeKey: NodeKey;
  format: ElementFormatType | null;
  imageKey: string;
  url: string;
  size: {
    width: number;
    height: number;
  }
}

type SerializedImageNode = SerializedDecoratorBlockNode & {
  $: {
    format: ElementFormatType
    key: string
    url: string
    size: {
      width: number
      height: number
    }
  }
}

const getSafeUrl = (key: string, url: string) => {
  if (location.protocol === 'https:') return url
  return `/media?key=${encodeURIComponent(key)}`
}

const ImageComp = ({ nodeKey, format, url, imageKey, size }: ImageCompProps) => {
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
        data-key={imageKey}
        data-url={url}
        className="inline-block max-w-full max-h-100 object-contain border-2 border-transparent group-[.image-focus]/image-block:border-cyan-500"
        src={getSafeUrl(imageKey, url) || "https://picsum.photos/192/192"}
        width={`${size.width | 100}px`}
        height={`${size.height | 50}px`}
        onClick={(e) => {
          clearSelection();
          setSelected(!isSelected)
          e.preventDefault()
        }}
      />
    </BlockWithAlignableContents>
  );
};

export const keyState = createState('key', {
  parse: stringValue()
})

export const urlState = createState('url', {
  parse: stringValue()
})

export const sizeState = createState('size', {
  parse: objectValue({
    width: numberValue(),
    height: numberValue()
  })
})

export class ImageNode extends DecoratorBlockNode {
  static getType(): string {
    return "image";
  }

  $config() {
    return this.config('image', {
      extends: DecoratorBlockNode,
      stateConfigs: [
        { stateConfig: keyState },
        { stateConfig: urlState },
        { stateConfig: sizeState },
      ]
    })
  }

  // serialize

  static importJSON(_serializedNode: SerializedImageNode): ImageNode {
    const node = $createImageNode(_serializedNode.$);
    return node
  }

  exportJSON(): SerializedImageNode {
    const obj = super.exportJSON() as SerializedImageNode
    return {
      ...obj,
      $: {
        ...obj.$,
        format: this.getFormat()
      }
    }
  }

  // view

  decorate() {
    return <ImageComp
      nodeKey={this.getKey()}
      format={this.getFormat()}
      url={$getState(this, urlState)}
      imageKey={$getState(this, keyState)}
      size={$getState(this, sizeState)}
    />;
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

export interface CreateImageNodeProps {
  format?: ElementFormatType
  key?: string
  url?: string
  size?: {
    width: number
    height: number
  }
}

export function $createImageNode(props?: CreateImageNodeProps): ImageNode {
  const { format, key, url, size } = props ?? {}
  const node = $create(ImageNode);
  if (format) node.setFormat(format)
  if (key) $setState(node, keyState, key)
  if (url) $setState(node, urlState, url)
  if (size) $setState(node, sizeState, size)
  return node
}

export function $isImageNode(node: unknown): node is ImageNode {
  return node instanceof ImageNode;
}
