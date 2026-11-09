import { CustomCommand } from "@/constants";
import { $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand, defineExtension } from "lexical";
import { $createImageNode, ImageNode } from "./ImageNode";

export const INSERT_IMAGE_COMMAND = createCommand(CustomCommand.INSERT_IMAGE_COMMAND)

export const ImageExtension = defineExtension({
  name: 'editor/image',
  nodes: () => [ImageNode],
  register(editor) {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      () => {
        $insertNodes([$createImageNode()])
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }
})
