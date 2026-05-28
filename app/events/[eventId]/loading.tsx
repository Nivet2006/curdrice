export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--fg)' }}
        />
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>
          Loading event...
        </p>
      </div>
    </div>
  )
}
