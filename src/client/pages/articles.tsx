import { createRoot } from 'react-dom/client'

import { PageLayout } from '@/components/PageLayout'
import { ArticlesPage } from '@/components/container/ArticlesPage'

const root = document.getElementById('app')
if (root) {
  createRoot(root).render(
    <PageLayout page="articles">
      <ArticlesPage />
    </PageLayout>,
  )
}
