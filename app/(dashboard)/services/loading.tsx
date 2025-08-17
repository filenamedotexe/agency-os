import { ServicesListSkeleton } from "./components/services-skeleton"
import { PageLayout, PageHeader, PageContent } from "@/shared/components/layout/page-layout"

export default function ServicesLoading() {
  return (
    <PageLayout>
      <PageHeader
        title="Services"
        subtitle="Loading services..."
      />
      <PageContent>
        <ServicesListSkeleton />
      </PageContent>
    </PageLayout>
  )
}