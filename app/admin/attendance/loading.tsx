import { PageHeader, SkeletonCard } from '@/components/shared/SkeletonLoader'
export default function Loading() {
  return (
    <div className="w-full pb-16">
      <PageHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1,2,3].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}
