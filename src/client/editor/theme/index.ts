import { EditorThemeClasses } from "lexical"
export const classTheme: EditorThemeClasses = {
  quote: 'border-l-4 border-l-slate-300 pl-2',
  heading: {
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-bold',
    h3: 'text-xl font-semibold',
    h4: 'text-lg font-semibold',
    h5: 'text-lg font-medium'
  },
  text: {
    strikethrough: 'line-through',
    underline: 'underline',
    code: 'px-1 py-0.5 mx-1 text-sm bg-slate-50 text-red-700 border border-pink-200 rounded-md'
  },
  list: {
    nested: {
      listitem: 'list-none list-nested',
    },
    ol: 'list-decimal pl-4 [.list-nested_&]:list-[lower-alpha] [.list-nested_.list-nested_&]:list-[lower-roman]',
    ul: 'list-disc pl-4 [.list-nested_&]:list-[circle] [.list-nested_.list-nested_&]:list-[square]',
    listitem: ''
  },
  code: 'block my-2 rounded-md p-2 bg-slate-50 border-2 border-sky-200',
  tableScrollableWrapper: ''
}
