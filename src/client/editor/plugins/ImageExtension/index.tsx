import { CustomCommand } from "@/constants";
import { COMMAND_PRIORITY_EDITOR, configExtension, createCommand, defineExtension } from "lexical";
import { $createImageNode, CreateImageNodeProps, ImageNode } from "./ImageNode";
import { DOMImportExtension } from "@lexical/html";
import { ImageImportRule } from "./ImageTransversion";
import { $insertNodeToNearestRoot } from "@lexical/utils";

export const INSERT_IMAGE_COMMAND = createCommand<CreateImageNodeProps>(CustomCommand.INSERT_IMAGE_COMMAND)

export const ImageExtension = defineExtension({
  name: 'editor/image',
  nodes: () => [ImageNode],
  dependencies: [
    configExtension(DOMImportExtension, { rules: [ImageImportRule ]})
  ],
  register(editor) {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload: CreateImageNodeProps) => {
        $insertNodeToNearestRoot($createImageNode(payload))
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }
})
