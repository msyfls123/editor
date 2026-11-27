import { CustomCommand } from "@/editor/constants";
import { $createDiagramNode, CreateDiagramProps, DiagramCodeRootNode, DiagramNode } from "@/editor/plugins/DiagramExtension/DiagramNode";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { DOMImportExtension, DOMRenderExtension } from "@lexical/html";
import { configExtension, $createNodeSelection, $getSelection, $getSelectionSlotFrame, $getSlot, $getSlotHost, $isNodeSelection, $setSelection, COMMAND_PRIORITY_BEFORE_EDITOR, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_LOW, createCommand, defineExtension, ElementNode, KEY_ENTER_COMMAND, KEY_ESCAPE_COMMAND, KEY_TAB_COMMAND, mergeRegister } from "lexical";
import { DiagramImportRule, DiagramRenderRule, LegacyDiagramImportRule } from "./DiagramTransversion";

export const INSERT_DIAGRAM_COMMAND = createCommand<CreateDiagramProps | undefined>(CustomCommand.INSERT_DIAGRAM_COMMAND)

export const DiagramExtension = defineExtension({
  name: 'editor/diagram',
  nodes: () => [DiagramNode, DiagramCodeRootNode],
  dependencies: [
    configExtension(DOMImportExtension, { rules: [DiagramImportRule, LegacyDiagramImportRule] }),
    configExtension(DOMRenderExtension, { overrides: [DiagramRenderRule] }),
  ],
  register(editor) {
    return mergeRegister(
      editor.registerCommand(
        INSERT_DIAGRAM_COMMAND, (payload) => {
          $insertNodeToNearestRoot($createDiagramNode(payload))
          return true
        }, COMMAND_PRIORITY_BEFORE_EDITOR),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event) => {
          const selection = $getSelection()

          if (!$isNodeSelection(selection)) {
            return false
          }

          const selectedNodes = selection.getNodes()

          const diagramNode = selectedNodes.find(
            (node) => node instanceof DiagramNode,
          )

          if (!diagramNode) {
            return false
          }

          const codeRoot = $getSlot(diagramNode, 'code') as ElementNode

          if (!codeRoot) {
            return false
          }

          const firstBlock = codeRoot.getFirstChild()

          if (!firstBlock) {
            return false
          }

          event?.preventDefault()

          firstBlock.selectStart()

          return true
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        (event) => {
          const selection = $getSelection()

          if (!selection) {
            return false
          }

          // Determine whether the current selection is inside a Slot.
          const slotFrame = $getSelectionSlotFrame(selection)

          if (!slotFrame) {
            return false
          }

          const host = $getSlotHost(slotFrame)

          if (!(host instanceof DiagramNode)) {
            return false
          }

          event?.preventDefault()

          // Select the entire DiagramNode.
          const nodeSelection = $createNodeSelection()
          nodeSelection.add(host.getKey())

          $setSelection(nodeSelection)

          return true
        },
        COMMAND_PRIORITY_HIGH,
      )
    )
  }
})
