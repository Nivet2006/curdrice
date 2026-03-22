import { PageHeader, SkeletonCard, SkeletonBlock } from '@/components/shared/SkeletonLoader'
export default function Loading() {
  return (
    <div className="w-full pb-16">
      <PageHeader />
      <SkeletonBlock h={56} />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}
