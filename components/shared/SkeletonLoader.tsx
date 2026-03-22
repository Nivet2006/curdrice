export function SkeletonBar({ w = '100%', h = 12 }: { w?: string; h?: number }) {
  return (
    <div
      className="animate-pulse rounded-md bg-[#e0e0e0]"
      style={{ width: w, height: `${h}px` }}
    />
  )
}

export function SkeletonBlock({ h = 64 }: { h?: number }) {
  return (
    <div
      className="animate-pulse rounded-xl bg-[#e0e0e0]"
      style={{ height: `${h}px`, width: '100%' }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[#e0e0e0] p-6 flex flex-col gap-4">
      <SkeletonBar w="40%" h={14} />
      <SkeletonBar w="70%" h={10} />
      <SkeletonBar w="55%" h={10} />
      <SkeletonBlock h={40} />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="rounded-2xl border border-[#e0e0e0] overflow-hidden">
      <div className="bg-[#f5f5f5] px-6 py-4 flex gap-8">
        <SkeletonBar w="20%" h={10} />
        <SkeletonBar w="15%" h={10} />
        <SkeletonBar w="15%" h={10} />
        <SkeletonBar w="10%" h={10} />
      </div>
      {[1,2,3,4].map(i => (
        <div key={i} className="px-6 py-4 border-t border-[#e0e0e0] flex gap-8 items-center">
          <div className="flex flex-col gap-2 w-[20%]">
            <SkeletonBar w="80%" h={11} />
            <SkeletonBar w="60%" h={9} />
          </div>
          <SkeletonBar w="15%" h={10} />
          <SkeletonBar w="15%" h={24} />
          <SkeletonBar w="10%" h={10} />
        </div>
      ))}
    </div>
  )
}

export function PageHeader() {
  return (
    <div className="mb-8 flex flex-col gap-3">
      <SkeletonBar w="30%" h={28} />
      <SkeletonBar w="50%" h={12} />
    </div>
  )
}
