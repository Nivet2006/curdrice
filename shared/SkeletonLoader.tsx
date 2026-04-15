export function SkeletonBar({
  w = '100%',
  h = 12,
}: {
  w?: string
  h?: number
}) {
  return (
    <div
      className="animate-pulse rounded-md"
      style={{
        width: w,
        height: `${h}px`,
        background: 'var(--border)',
      }}
    />
  )
}

export function SkeletonBlock({ h = 64 }: { h?: number }) {
  return (
    <div
      className="animate-pulse rounded-xl w-full"
      style={{
        height: `${h}px`,
        background: 'var(--border)',
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border border-[#e0e0e0] p-5 flex flex-col gap-3"
      style={{ background: 'var(--bg-card)' }}
    >
      <SkeletonBar w="50%" h={10} />
      <SkeletonBar w="30%" h={32} />
      <SkeletonBar w="65%" h={9} />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="rounded-2xl border border-[#e0e0e0] overflow-hidden">
      <div
        className="px-6 py-4 flex gap-8 border-b border-[#e0e0e0]"
        style={{ background: 'var(--bg-subtle)' }}
      >
        {['25%', '20%', '20%', '15%'].map((w, i) => (
          <SkeletonBar key={i} w={w} h={10} />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className="px-6 py-4 border-b border-[#e0e0e0] flex gap-8 items-center"
          style={{ background: 'var(--bg-card)' }}
        >
          <div className="flex flex-col gap-2 w-[25%]">
            <SkeletonBar w="80%" h={11} />
            <SkeletonBar w="55%" h={9} />
          </div>
          <SkeletonBar w="20%" h={10} />
          <SkeletonBar w="20%" h={24} />
          <SkeletonBar w="15%" h={28} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonEventRow() {
  return (
    <div
      className="flex gap-4 rounded-2xl border border-[#e0e0e0] p-4"
      style={{ background: 'var(--bg-card)' }}
    >
      <div
        className="w-[80px] h-[80px] rounded-xl animate-pulse flex-shrink-0"
        style={{ background: 'var(--border)' }}
      />
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <SkeletonBar w="20%" h={9} />
        <SkeletonBar w="60%" h={13} />
        <SkeletonBar w="35%" h={9} />
        <div className="flex gap-2 mt-1">
          <SkeletonBar w="80px" h={26} />
          <SkeletonBar w="60px" h={26} />
        </div>
      </div>
    </div>
  )
}

export function PageHeader() {
  return (
    <div className="mb-8 flex flex-col gap-3">
      <SkeletonBar w="28%" h={30} />
      <SkeletonBar w="45%" h={12} />
    </div>
  )
}

