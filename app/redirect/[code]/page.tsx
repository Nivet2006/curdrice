import * as React from 'react';
import { ArrowRight, ExternalLink, RefreshCw, AlertTriangle, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { RedirectClient } from './RedirectClient';

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ to?: string; delay?: string }>;
}

const REDIRECT_INFO: Record<string, { title: string; description: string; detail: string }> = {
  '301': {
    title: '301 Moved Permanently',
    description: 'The requested resource has been assigned a new permanent URI.',
    detail: 'This status code indicates that the target resource has been assigned a new permanent URI and any future references to this resource should use one of the returned URIs. Browsers can cache this redirection.'
  },
  '302': {
    title: '302 Found',
    description: 'The requested resource resides temporarily under a different URI.',
    detail: 'This status code indicates that the target resource resides temporarily under a different URI. Since the redirection might be altered on occasion, the client ought to continue to use the effective request URI for future requests.'
  },
  '307': {
    title: '307 Temporary Redirect',
    description: 'The requested resource resides temporarily under a different URI.',
    detail: 'This status code indicates that the target resource resides temporarily under a different URI and the user agent MUST NOT change the request method if it performs an automatic redirection to that URI. (i.e. POST requests will remain POST requests).'
  },
  '308': {
    title: '308 Permanent Redirect',
    description: 'The requested resource has been assigned a new permanent URI.',
    detail: 'This status code indicates that the target resource has been assigned a new permanent URI and the user agent MUST NOT change the request method if it performs an automatic redirection to that URI. (i.e. POST requests will remain POST requests).'
  }
};

export default async function RedirectPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const { to, delay } = await searchParams;

  const info = REDIRECT_INFO[code] || {
    title: `${code} Redirect`,
    description: 'Redirection in progress.',
    detail: 'The server is redirecting you to a new location.'
  };

  const parsedDelay = Math.max(1, parseInt(delay || '3', 10));
  const targetUrl = to || '';

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center font-sans p-6 md:p-8 select-none transition-colors" 
      style={{ background: 'var(--bg)' }}
    >
      {/* Decorative Grid Lines to match Brutalist system */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />

      <main className="relative z-10 w-full max-w-xl bg-white dark:bg-zinc-950 border-2 border-black dark:border-zinc-800 rounded-[2rem] p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(38,38,38,1)] transition-all">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 bg-black text-white dark:bg-zinc-900 dark:text-zinc-100 px-6 py-2 rounded-2xl border-2 border-black dark:border-zinc-700 font-mono text-xs uppercase tracking-widest font-black">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            HTTP REDIRECT PIPELINE
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase" style={{ color: 'var(--fg)' }}>
            {code}
          </h1>
          <h2 className="text-lg md:text-xl font-bold tracking-tight opacity-90" style={{ color: 'var(--fg)' }}>
            {info.title.split(' ').slice(1).join(' ')}
          </h2>
          <p className="text-sm font-mono tracking-wide opacity-60 max-w-md" style={{ color: 'var(--fg)' }}>
            {info.description}
          </p>
        </div>

        {/* Target Redirection Details */}
        <div className="space-y-6">
          {targetUrl ? (
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="text-[10px] font-black font-mono uppercase tracking-widest opacity-40">Target Destination</div>
              <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <span className="font-mono text-xs truncate flex-1 select-all" style={{ color: 'var(--fg)' }}>
                  {targetUrl}
                </span>
                <a 
                  href={targetUrl}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Countdown Component */}
              <RedirectClient targetUrl={targetUrl} delay={parsedDelay} />
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-500/20 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
              <div className="text-xs font-black font-mono uppercase tracking-widest text-rose-600 dark:text-rose-400">Missing Target URI</div>
              <p className="text-xs opacity-70" style={{ color: 'var(--fg)' }}>
                Please provide a destination target URL using the query parameter <code>?to=...</code>.
              </p>
            </div>
          )}

          {/* Technical Protocol Notes */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-2.5">
            <div className="flex items-center gap-2 text-[10px] font-black font-mono uppercase tracking-widest opacity-40">
              <HelpCircle className="w-3.5 h-3.5" />
              Protocol Details
            </div>
            <p className="text-[11px] leading-relaxed opacity-60" style={{ color: 'var(--fg)' }}>
              {info.detail}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center text-[9px] font-mono uppercase tracking-widest opacity-35">
          <span>Club-Eve Router</span>
          <span>Security Protocol v1.4</span>
        </div>
      </main>
    </div>
  );
}
