import { PageHeader, SkeletonTable, SkeletonBlock } from '@/components/shared/SkeletonLoader'
export default function Loading() {
  return (
    <div className="w-full pb-32">
      <PageHeader />
      <SkeletonBlock h={56} />
      <div className="mt-6">
        <SkeletonTable />
      </div>
    </div>
  )
}
