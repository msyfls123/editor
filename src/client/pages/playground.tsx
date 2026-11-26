import { createRoot } from 'react-dom/client'

import { PageLayout } from '@/components/PageLayout'
import { PlaygroundPage } from '@/components/container/PlaygroundPage'

const root = document.getElementById('app')
if (root) {
  createRoot(root).render(
    <PageLayout page="playground">
      <PlaygroundPage />
    </PageLayout>,
  )
}
