import { createRoot } from 'react-dom/client'

import { PageLayout } from '@/components/PageLayout'
import { HomePage } from '@/components/container/HomePage'

const root = document.getElementById('app')
if (root) {
  createRoot(root).render(
    <PageLayout>
      <HomePage />
    </PageLayout>,
  )
}
