import type { ReactNode } from 'react'

import { AuthMenu } from '@/components/AuthMenu'
import { AuthProvider } from '@/components/AuthProvider'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Toaster } from '@/components/ui/toast'

export function PageLayout({
  page,
  children,
}: {
  page?: string
  children: ReactNode
}) {
  return (
    <Toaster>
      <AuthProvider>
        <div className="min-h-screen bg-[#f5f4f0] px-3 pt-4 pb-12 sm:px-6">
          <header className="mx-auto mb-8 flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-emerald-300/60 bg-emerald-200 text-sm font-bold text-emerald-950">
                ξ
              </span>
              <Breadcrumb className="min-w-0">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    {page ? (
                      <BreadcrumbLink href="/">editor</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="font-semibold text-slate-900">
                        editor
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {page && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="font-semibold text-slate-900">
                          {page}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <AuthMenu />
          </header>

          <main className="mx-auto w-full max-w-6xl">{children}</main>
        </div>
      </AuthProvider>
    </Toaster>
  )
}
