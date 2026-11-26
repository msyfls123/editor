import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BlockType, BlockTypeValue } from "@/editor/constants/format";
import { useBlockType } from "@/editor/hooks/useBlockType";
import { useSetBlockType } from "@/editor/hooks/useSetBlockType";
import { useMemo } from "react";
import { Blend, CodeXml, Heading1, Heading2, Heading3, List, ListOrdered, LucideIcon, Pilcrow, Quote } from 'lucide-react'

const BLOCKS: Array<{
  value: Exclude<BlockTypeValue, null>
  name: string
  icon: LucideIcon
  disabled?: boolean
  renderIfNeeded?: boolean
}> = [
  {
    name: 'Mixed',
    value: 'mixed',
    icon: Blend,
    renderIfNeeded: true,
    disabled: true,
  },
  {
    name: 'Paragraph',
    value: 'paragraph',
    icon: Pilcrow
  },
  {
      name: 'Heading 1',
      value: 'h1',
      icon: Heading1
    },
    {
        name: 'Heading 2',
        value: 'h2',
        icon: Heading2
    },
    {
        name: 'Heading 3',
        value: 'h3',
        icon: Heading3
    },
    {
      name: 'Bullet List',
      value: 'ul',
      icon: List
    },
    {
      name: 'Numbered List',
      value: 'ol',
      icon: ListOrdered
    },
    {
      name: 'Blockquote',
      value: 'blockquote',
      icon: Quote
    },
    {
      name: 'Code Block',
      value: 'code',
      icon: CodeXml
    }
]

export function BlockTypeSelect() {
  const blockType = useBlockType();
  const setBlockType = useSetBlockType();

  const handleChange = (value: string | null) => {
    if (!value || value === 'mixed') return;

    setBlockType(value as BlockType);
  };

  const renderBlocks = useMemo(() => BLOCKS.filter((item) =>
    !(item.renderIfNeeded && blockType !== item.value)
  ), [blockType])

  const renderValue = useMemo(() => {
    const selectedBlock = BLOCKS.find((block) => block.value === blockType)
    if (!selectedBlock) return <span></span>
    const Icon = selectedBlock.icon
    return <SelectItem disabled={selectedBlock.disabled}>
      <Icon className="mr-2 size-5 p-0.5 bg-emerald-600 text-white rounded" />
      <span>{selectedBlock.name}</span>
    </SelectItem>
  }, [blockType])

  return (
    <Select
      value={blockType ?? ''}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-40 bg-white">
        <SelectValue
          render={renderValue}
          placeholder="Block type"
        />
      </SelectTrigger>

      <SelectContent side="bottom" >
        {renderBlocks.map(({ value, name, icon: Icon, disabled }) => (
          <SelectItem key={value} value={value} disabled={disabled}>
            <Icon className="mr-2 size-5 p-0.5 bg-emerald-600 text-white! rounded" />
            <span>{name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
