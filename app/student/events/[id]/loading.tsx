import { PageHeader, SkeletonBlock } from '@/components/shared/SkeletonLoader'
export default function Loading() {
  return (
    <div className="w-full pb-16">
      <PageHeader />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <SkeletonBlock h={200} />
        </div>
        <SkeletonBlock h={300} />
      </div>
    </div>
  )
}
