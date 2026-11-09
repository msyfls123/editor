import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  DecoratorNode,
  $create,
  type NodeKey,
  type SerializedLexicalNode,
  BaseSelection,
} from "lexical";
import { ReactNode } from "react";

const ImageComp = () => {
  return <img src="https://picsum.photos/192/192" width="50px" height="50px" />
}

export class ImageNode extends DecoratorNode<ReactNode> {
  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__key)
  }

  static importJSON(_serializedNode: SerializedLexicalNode): ImageNode {
    return $createImageNode()
  }

  isInline(): boolean {
    return false
  }

  isKeyboardSelectable(): boolean {
    return true
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.contentEditable = 'false'
    return div
  }

  updateDOM(): false {
    return false
  }

  decorate(): ReactNode {
    return <ImageComp />
  }
}

export function $createImageNode(): ImageNode {
  return $create(ImageNode)
}

export function $isImageNode(
  node: unknown,
): node is ImageNode {
  return node instanceof ImageNode;
}
