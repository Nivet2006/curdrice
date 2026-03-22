import {
  PageHeader,
  SkeletonCard,
  SkeletonTable,
  SkeletonBlock,
} from '@/components/shared/SkeletonLoader'

export default function Loading() {
  return (
    <div className="w-full pb-16">
      <PageHeader />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonBlock h={20} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3, 4, 5].map(i => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
