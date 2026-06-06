'use client';

import * as React from 'react';
import { ArrowRight, CircleDot } from 'lucide-react';

interface RedirectClientProps {
  targetUrl: string;
  delay: number;
}

export function RedirectClient({ targetUrl, delay }: RedirectClientProps) {
  const [timeLeft, setTimeLeft] = React.useState(delay);
  const [cancelled, setCancelled] = React.useState(false);

  // Ensure timeLeft updates if the delay prop changes
  React.useEffect(() => {
    setTimeLeft(delay);
  }, [delay]);

  React.useEffect(() => {
    if (cancelled) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = targetUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetUrl, cancelled]);

  const progressPercent = ((delay - timeLeft) / delay) * 100;

  return (
    <div className="space-y-4 pt-2">
      {/* Progress Bar Container */}
      {!cancelled ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="flex items-center gap-1.5 opacity-60">
              <CircleDot className="w-3.5 h-3.5 animate-pulse text-zinc-500" />
              {timeLeft > 0 ? `Redirecting in ${timeLeft}s...` : 'Connecting...'}
            </span>
            <span className="font-bold">{Math.round(progressPercent)}%</span>
          </div>
          {/* Brutalist progress container */}
          <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900 border-2 border-black dark:border-zinc-800 rounded-lg overflow-hidden p-0.5">
            <div 
              className="h-full bg-black dark:bg-zinc-200 rounded-md transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="p-3 bg-zinc-100 dark:bg-zinc-900 text-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-mono opacity-60">
          Redirection cancelled. Click the button below to navigate manually.
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <a
          href={targetUrl}
          onClick={(e) => {
            if (!targetUrl) e.preventDefault();
          }}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-black font-bold text-sm px-6 py-3 rounded-xl border-2 border-black dark:border-zinc-700 transition-all hover:translate-y-[-2px] active:translate-y-[0px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] text-center"
        >
          Redirect Now
          <ArrowRight className="w-4 h-4" />
        </a>

        {!cancelled && timeLeft > 0 && (
          <button
            type="button"
            onClick={() => setCancelled(true)}
            className="inline-flex items-center justify-center border-2 border-zinc-200 hover:border-black dark:border-zinc-800 dark:hover:border-zinc-400 font-bold text-sm text-zinc-500 hover:text-black dark:hover:text-white px-6 py-3 rounded-xl transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
