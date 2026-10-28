import { createRoot } from 'react-dom/client'
import { Editor } from './Editor'

const rootEl = document.getElementById('app')
if (rootEl) {
  createRoot(rootEl).render(<Editor />)
}
