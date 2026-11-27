import { createRoot } from 'react-dom/client'

import { PageLayout } from '@/components/PageLayout'
import { DocumentPreviewPage } from '@/components/container/DocumentPreviewPage'

const docId = new URLSearchParams(window.location.search).get('docId')

const root = document.getElementById('app')
if (root) {
  createRoot(root).render(
    <PageLayout page="preview">
      <DocumentPreviewPage docId={docId} />
    </PageLayout>,
  )
}
