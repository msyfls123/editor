import { createRoot } from 'react-dom/client'

import { PageLayout } from '@/components/PageLayout'
import { ArticlePage } from '@/components/container/ArticlePage'

const docId = new URLSearchParams(window.location.search).get('docId')

const root = document.getElementById('app')
if (root) {
  createRoot(root).render(
    <PageLayout page="article">
      <ArticlePage docId={docId} />
    </PageLayout>,
  )
}
