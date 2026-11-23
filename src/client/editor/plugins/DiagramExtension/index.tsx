import { CustomCommand } from "@/editor/constants";
import { $createDiagramNode, CreateDiagramProps, DiagramCodeRootNode, DiagramNode } from "@/editor/plugins/DiagramExtension/DiagramNode";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { $getSelection, COMMAND_PRIORITY_BEFORE_EDITOR, COMMAND_PRIORITY_LOW, createCommand, defineExtension, KEY_ENTER_COMMAND, mergeRegister } from "lexical";

export const INSERT_DIAGRAM_COMMAND = createCommand<CreateDiagramProps | undefined>(CustomCommand.INSERT_DIAGRAM_COMMAND)

export const DiagramExtension = defineExtension({
  name: 'editor/diagram',
  nodes: () => [DiagramNode, DiagramCodeRootNode],
  register(editor) {
    return mergeRegister(
      editor.registerCommand(
        INSERT_DIAGRAM_COMMAND, (payload) => {
          $insertNodeToNearestRoot($createDiagramNode(payload))
          return true
      }, COMMAND_PRIORITY_BEFORE_EDITOR),
//       editor.registerCommand(
//         KEY_ENTER_COMMAND,
//         (event) => {
//           console.log('Enter pressed', editor.getEditorState().read(() => {
//             const selection = $getSelection()
//             return selection?.getNodes().map(node => node.getType())
//           }))
//
//           return false
//         },
//         COMMAND_PRIORITY_LOW,
//       )
    )
  }
})
