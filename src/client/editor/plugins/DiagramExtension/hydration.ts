const DIAGRAM_SELECTOR =
  '[data-lexical-component="diagram"][data-lexical-renderer="pele"]'
const SOURCE_SELECTOR = 'template[data-render-source]'
const OUTPUT_SELECTOR = '[data-render-output]'

type PeleModule = typeof import('pele')

let pelePromise: Promise<PeleModule> | undefined
const renderTasks = new WeakMap<HTMLElement, Promise<void>>()

function loadPele(): Promise<PeleModule> {
  pelePromise ??= import('pele')
  return pelePromise
}

function readSource(element: HTMLElement): string {
  const template = element.querySelector<HTMLTemplateElement>(SOURCE_SELECTOR)
  if (template) {
    return template.content.textContent ?? ''
  }

  const source = element.querySelector<HTMLElement>('[data-render-source]')
  return source?.textContent ?? ''
}

function readOutput(element: HTMLElement): HTMLElement | null {
  return element.querySelector<HTMLElement>(OUTPUT_SELECTOR)
}

function createIdPrefix(): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  return `diagram-${random}`
}

/**
 * Renders one placeholder with Pele. The module is loaded lazily and only once
 * per page; repeated calls for the same element share one task.
 */
export function hydrateDiagram(element: HTMLElement): Promise<void> {
  if (element.dataset.renderStatus === 'rendered') {
    return Promise.resolve()
  }

  const existing = renderTasks.get(element)
  if (existing) {
    return existing
  }

  const task = (async () => {
    element.dataset.renderStatus = 'loading'

    const source = readSource(element)
    if (!source.trim()) {
      throw new Error('Diagram source is empty')
    }

    const { render } = await loadPele()
    const { svg } = render(source, { idPrefix: createIdPrefix() })

    const output = readOutput(element)
    if (!output) {
      throw new Error('Diagram output container is missing')
    }

    output.innerHTML = svg
    element.dataset.renderStatus = 'rendered'
  })().catch((error: unknown) => {
    // Allow a later hydration pass to retry.
    renderTasks.delete(element)
    element.dataset.renderStatus = 'error'

    const output = readOutput(element)
    if (output) {
      output.textContent =
        error instanceof Error ? error.message : 'Diagram rendering failed'
    }
  })

  renderTasks.set(element, task)
  return task
}

/** Hydrates every diagram placeholder under `root`, including `root` itself. */
export function hydrateDiagrams(root: HTMLElement): Promise<void[]> {
  if (typeof document === 'undefined') {
    return Promise.resolve([])
  }

  const elements = Array.from(
    root.querySelectorAll<HTMLElement>(DIAGRAM_SELECTOR),
  )
  if (root.matches(DIAGRAM_SELECTOR)) {
    elements.unshift(root)
  }

  return Promise.all(elements.map((element) => hydrateDiagram(element)))
}
