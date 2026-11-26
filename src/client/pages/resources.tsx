import { createRoot } from 'react-dom/client'

import { PageLayout } from '@/components/PageLayout'
import { ResourcesPage } from '@/components/container/ResourcesPage'

const root = document.getElementById('app')
if (root) {
  createRoot(root).render(
    <PageLayout page="resources">
      <ResourcesPage />
    </PageLayout>,
  )
}
