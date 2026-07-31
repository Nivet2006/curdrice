'use client'

import React, { useState } from 'react'
import { BookOpen, Calendar, User, ArrowRight, X } from 'lucide-react'

interface ShowcaseBlogsProps {
  blogs: any[]
  clubName: string
  primaryColor?: string
}

export function ShowcaseBlogsSection({ blogs = [], clubName, primaryColor = '#f59e0b' }: ShowcaseBlogsProps) {
  const [activeBlog, setActiveBlog] = useState<any | null>(null)

  return (
    <section id="blogs" className="py-24 border-t border-[#E6E8EC] dark:border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div>
            <span
              className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 inline-block mb-3 shadow-sm"
              style={{ color: primaryColor }}
            >
              INSIGHTS &amp; ARTICLES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight">
              Blogs &amp; News
            </h2>
          </div>
        </div>

        {/* Blogs Grid */}
        {blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, idx) => (
              <div
                key={blog.id || idx}
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden group hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between shadow-xl"
              >
                {blog.cover_image && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={blog.cover_image}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-6 space-y-4 flex-1">
                  <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1"><Calendar size={12} className="text-amber-500" /> {new Date(blog.published_at || blog.created_at).toLocaleDateString()}</span>
                    {blog.author_name && <span className="flex items-center gap-1"><User size={12} className="text-amber-500" /> {blog.author_name}</span>}
                  </div>

                  <h3 className="text-xl font-bold font-mono text-zinc-900 dark:text-white uppercase group-hover:text-amber-500 transition-colors line-clamp-2">
                    {blog.title}
                  </h3>

                  <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {blog.excerpt || blog.content.substring(0, 150) + '...'}
                  </p>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => setActiveBlog(blog)}
                    className="w-full py-3 bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center justify-center gap-2 transition-all"
                  >
                    Read Article <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <BookOpen size={36} className="mx-auto text-zinc-400 dark:text-zinc-600" />
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-widest font-bold">
              No blog posts published yet
            </p>
          </div>
        )}
      </div>

      {/* Reader Modal */}
      {activeBlog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-3xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto my-8">
            <button
              onClick={() => setActiveBlog(null)}
              className="absolute top-6 right-6 p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <span className="text-xs font-mono text-amber-500 uppercase font-bold">{clubName} Blog</span>
              <h2 className="text-2xl sm:text-3xl font-black font-mono uppercase text-zinc-900 dark:text-white">{activeBlog.title}</h2>
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span>By {activeBlog.author_name || 'Club Admin'}</span>
                <span>•</span>
                <span>{new Date(activeBlog.published_at || activeBlog.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {activeBlog.cover_image && (
              <img src={activeBlog.cover_image} alt={activeBlog.title} className="w-full h-64 object-cover rounded-2xl" />
            )}

            <div className="prose dark:prose-invert max-w-none text-sm font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-4">
              {activeBlog.content.split('\n\n').map((paragraph: string, i: number) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
