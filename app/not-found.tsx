'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden"
    >
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes spin-slow { to{transform:rotate(360deg)} }
        @keyframes spin-rev { to{transform:rotate(-360deg)} }
        @keyframes wander { 0%{transform:translate(0,0)} 25%{transform:translate(20px,-10px)} 50%{transform:translate(8px,14px)} 75%{transform:translate(-16px,4px)} 100%{transform:translate(0,0)} }
        @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:.25} 50%{transform:scale(1.2);opacity:.08} }
        @keyframes drift { 0%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(180deg)} 100%{transform:translateY(0) rotate(360deg)} }
        .nf-float { animation: float 4s ease-in-out infinite; }
        .nf-gear1 { animation: spin-slow 5s linear infinite; transform-box:fill-box; transform-origin:50% 50%; }
        .nf-gear2 { animation: spin-rev 3.5s linear infinite; transform-box:fill-box; transform-origin:50% 50%; }
        .nf-gear3 { animation: spin-slow 7s linear infinite; transform-box:fill-box; transform-origin:50% 50%; }
        .nf-gear4 { animation: spin-rev 4s linear infinite; transform-box:fill-box; transform-origin:50% 50%; }
        .nf-dot1 { animation: wander 6s ease-in-out infinite; }
        .nf-dot2 { animation: wander 9s ease-in-out infinite reverse; }
        .nf-dot3 { animation: wander 7s ease-in-out infinite 1.5s; }
        .nf-dot4 { animation: wander 8s ease-in-out infinite 3s reverse; }
        .nf-ring1 { animation: pulse-ring 2.5s ease-in-out infinite; transform-box:fill-box; transform-origin:50% 50%; }
        .nf-ring2 { animation: pulse-ring 3.5s ease-in-out infinite .8s; transform-box:fill-box; transform-origin:50% 50%; }
        .nf-drift { animation: drift 8s ease-in-out infinite; }
      `}</style>

      <svg width="100%" viewBox="0 0 680 380" style={{ maxWidth: 600 }}>

        <circle className="nf-ring1" cx="340" cy="180" r="160"
          fill="none" stroke="#e0e0e0" strokeWidth="1" />
        <circle className="nf-ring2" cx="340" cy="180" r="110"
          fill="none" stroke="#e8e8e8" strokeWidth="0.5" />

        <circle className="nf-dot1" cx="100" cy="80" r="5" fill="#d0d0d0" />
        <circle className="nf-dot2" cx="580" cy="100" r="4" fill="#d8d8d8" />
        <circle className="nf-dot3" cx="80" cy="300" r="6" fill="#e0e0e0" />
        <circle className="nf-dot4" cx="600" cy="280" r="4" fill="#d0d0d0" />
        <circle className="nf-dot1" cx="180" cy="340" r="3" fill="#d8d8d8"
          style={{ animationDelay: '2s' }} />
        <circle className="nf-dot2" cx="500" cy="340" r="5" fill="#e0e0e0"
          style={{ animationDelay: '4s' }} />

        <g className="nf-gear1" transform="translate(90,70)">
          <circle r="26" cx="0" cy="0" fill="none" stroke="#c8c8c8" strokeWidth="2.5" />
          <circle r="10" cx="0" cy="0" fill="#f5f5f5" stroke="#c8c8c8" strokeWidth="2" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
            <rect key={i} x="-4" y="-32" width="8" height="12" rx="2"
              fill="#c8c8c8"
              transform={`rotate(${a})`} />
          ))}
        </g>

        <g className="nf-gear2" transform="translate(590,90)">
          <circle r="20" cx="0" cy="0" fill="none" stroke="#cccccc" strokeWidth="2" />
          <circle r="8" cx="0" cy="0" fill="#f5f5f5" stroke="#cccccc" strokeWidth="1.5" />
          {[0, 60, 120, 180, 240, 300].map((a, i) => (
            <rect key={i} x="-3" y="-25" width="6" height="10" rx="2"
              fill="#cccccc"
              transform={`rotate(${a})`} />
          ))}
        </g>

        <g className="nf-gear3" transform="translate(120,320)">
          <circle r="18" cx="0" cy="0" fill="none" stroke="#d0d0d0" strokeWidth="2" />
          <circle r="7" cx="0" cy="0" fill="#f5f5f5" stroke="#d0d0d0" strokeWidth="1.5" />
          {[0, 60, 120, 180, 240, 300].map((a, i) => (
            <rect key={i} x="-2.5" y="-22" width="5" height="9" rx="2"
              fill="#d0d0d0"
              transform={`rotate(${a})`} />
          ))}
        </g>

        <g className="nf-gear4" transform="translate(570,320)">
          <circle r="30" cx="0" cy="0" fill="none" stroke="#c4c4c4" strokeWidth="2.5" />
          <circle r="12" cx="0" cy="0" fill="#f5f5f5" stroke="#c4c4c4" strokeWidth="2" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
            <rect key={i} x="-4" y="-36" width="8" height="13" rx="2"
              fill="#c4c4c4"
              transform={`rotate(${a})`} />
          ))}
        </g>

        <g className="nf-float">
          <text x="340" y="230" textAnchor="middle"
            style={{
              fontSize: '160px', fontWeight: 900, fontFamily: 'monospace',
              fill: '#0a0a0a', opacity: 0.06, userSelect: 'none'
            }}>
            404
          </text>
          <text x="340" y="225" textAnchor="middle"
            style={{
              fontSize: '130px', fontWeight: 900, fontFamily: 'monospace',
              fill: '#0a0a0a', letterSpacing: '-4px', userSelect: 'none'
            }}>
            404
          </text>
        </g>

        <g className="nf-drift" transform="translate(200,60)">
          <rect x="-20" y="-6" width="40" height="12" rx="3"
            fill="none" stroke="#d8d8d8" strokeWidth="1.5" />
        </g>
        <g className="nf-drift" transform="translate(470,50)" style={{ animationDelay: '2s' }}>
          <rect x="-14" y="-5" width="28" height="10" rx="3"
            fill="none" stroke="#e0e0e0" strokeWidth="1" />
        </g>
        <g className="nf-drift" transform="translate(480,310)" style={{ animationDelay: '4s' }}>
          <rect x="-18" y="-5" width="36" height="10" rx="3"
            fill="none" stroke="#d8d8d8" strokeWidth="1.5" />
        </g>
      </svg>

      <div className="text-center -mt-6">
        <p className="text-2xl font-black text-[#0a0a0a] mb-2 tracking-tight">
          Page not found
        </p>
        <p className="font-mono text-sm text-[#555555] mb-2">
          |||··|| — error 404
        </p>
        <p className="font-mono text-xs text-[#999999] mb-8">
          This page doesn't exist or was moved.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-[#0a0a0a] text-white font-mono text-sm rounded-full hover:bg-[#333] transition-colors"
        >
          ← Go home
        </Link>
      </div>
    </div>
  )
}
