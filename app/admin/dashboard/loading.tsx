import { PageHeader, SkeletonBlock, SkeletonBar } from '@/components/shared/SkeletonLoader'
export default function Loading() {
  return (
    <div className="w-full pb-16 animate-pulse">
      <PageHeader />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => <SkeletonBlock key={i} h={80} />)}
      </div>
      <SkeletonBlock h={200} />
    </div>
  )
}
