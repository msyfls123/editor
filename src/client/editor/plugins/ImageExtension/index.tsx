import { CustomCommand } from "@/editor/constants";
import { COMMAND_PRIORITY_EDITOR, configExtension, createCommand, defineExtension } from "lexical";
import { $createImageNode, CreateImageNodeProps, ImageNode } from "./ImageNode";
import { DOMImportExtension, DOMRenderExtension } from "@lexical/html";
import { ImageImportRule, ImageRenderRule } from "./ImageTransversion";
import { $insertNodeToNearestRoot } from "@lexical/utils";

export const INSERT_IMAGE_COMMAND = createCommand<CreateImageNodeProps>(CustomCommand.INSERT_IMAGE_COMMAND)

export const ImageExtension = defineExtension({
  name: 'editor/image',
  nodes: () => [ImageNode],
  dependencies: [
    configExtension(DOMImportExtension, { rules: [ImageImportRule ]}),
    configExtension(DOMRenderExtension, { overrides: [ImageRenderRule] })
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
