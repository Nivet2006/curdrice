import { PageHeader, SkeletonBlock, SkeletonTable } from '@/components/shared/SkeletonLoader'
export default function Loading() {
  return (
    <div className="w-full pb-16">
      <PageHeader />
      <SkeletonBlock h={120} />
      <div className="mt-8">
        <SkeletonTable />
      </div>
    </div>
  )
}
