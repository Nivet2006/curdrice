import {
  PageHeader,
  SkeletonEventRow,
  SkeletonBlock,
} from '@/components/shared/SkeletonLoader'

export default function Loading() {
  return (
    <div className="w-full pb-16">
      <PageHeader />
      <div className="flex gap-4 mb-6">
        <SkeletonBlock h={36} />
      </div>
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <SkeletonEventRow key={i} />
        ))}
      </div>
    </div>
  )
}
