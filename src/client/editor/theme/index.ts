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
  tableScrollableWrapper: 'overflow-x-auto',
  table: 'border border-slate-300 my-4',
  tableCell: 'p-1 not-last:border-r border-slate-300 min-w-10',
  tableRow: 'not-last:border-b border-slate-300',
  tableCellHeader: 'bg-slate-200/50 py-2',
  // code: 'block my-2 rounded-md p-2 bg-slate-50 border-2 border-sky-200',
  code: [
    'block bg-[#1d2021] text-[#ebdbb2] rounded-md p-2 pl-1 font-mono text-sm leading-6 overflow-x-auto caret-current',
    'before:sticky before:content-[attr(data-gutter)] before:left-0 before:float-left before:z-3 before:text-slate-400',
    'before:text-right before:max-w-9 before:mr-2 before:-my-2 before:p-2 before:border-r before:border-r-slate-700'
  ].join(' '),
  codeHighlight: {
    atrule: 'text-[#d3869b]',
    attr: 'text-[#fabd2f]',
    boolean: 'text-[#d3869b]',
    builtin: 'text-[#8ec07c]',
    cdata: 'text-[#665c54]',
    char: 'text-[#b8bb26]',
    class: 'text-[#fabd2f]',
    'class-name': 'text-[#fabd2f]',
    comment: 'text-[#665c54] italic',
    constant: 'text-[#d3869b]',
    deleted: 'text-[#fb4934]',
    doctype: 'text-[#665c54]',
    entity: 'text-[#fe8019]',
    function: 'text-[#fabd2f]',
    important: 'text-[#fb4934]',
    inserted: 'text-[#b8bb26]',
    keyword: 'text-[#fb4934]',
    namespace: 'text-[#fe8019]',
    number: 'text-[#d3869b]',
    operator: 'text-[#8ec07c]',
    prolog: 'text-[#665c54]',
    property: 'text-[#83a598]',
    punctuation: 'text-[#a89984]',
    regex: 'text-[#fe8019]',
    selector: 'text-[#8ec07c]',
    string: 'text-[#b8bb26]',
    symbol: 'text-[#d3869b]',
    tag: 'text-[#fb4934]',
    url: 'text-[#83a598]',
    variable: 'text-[#83a598]',
  },
}
