import { PageHeader, SkeletonTable } from '@/components/shared/SkeletonLoader'
export default function Loading() {
  return (
    <div className="w-full pb-16">
      <PageHeader />
      <SkeletonTable />
    </div>
  )
}
