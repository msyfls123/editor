import { createRoot } from 'react-dom/client'
import { Root } from './Root'

const rootEl = document.getElementById('app')
if (rootEl) {
  createRoot(rootEl).render(<Root />)
}
