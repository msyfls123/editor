import { ElementFormatType } from "lexical"

export enum FormatStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MIXED = 'mixed'
}

export interface FormatState {
  bold: FormatStatus
  italic: FormatStatus
  underline: FormatStatus
  strikethrough: FormatStatus
  highlight: FormatStatus
  subscript: FormatStatus
  superscript: FormatStatus
  align: ElementFormatType
}


export interface CommonButtonProps {
  formatStatus: FormatStatus
}

export type BlockType =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'ul'
  | 'ol'
  | 'blockquote'
  | 'code';

export type BlockTypeValue = BlockType | 'mixed' | null;
