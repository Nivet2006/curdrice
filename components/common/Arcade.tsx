'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trophy, RotateCcw, Ghost } from 'lucide-react'

// --- Maze Generation (Prim's Algorithm) ---
const generateMaze = (width: number, height: number) => {
  const maze = Array(height).fill(null).map(() => Array(width).fill(1))
  const walls: [number, number, number, number][] = []

  const addWalls = (x: number, y: number) => {
    if (x > 1) walls.push([x - 2, y, x - 1, y])
    if (x < width - 2) walls.push([x + 2, y, x + 1, y])
    if (y > 1) walls.push([x, y - 2, x, y - 1])
    if (y < height - 2) walls.push([x, y + 2, x, y + 1])
  }

  const startX = 1, startY = 1
  maze[startY][startX] = 0
  addWalls(startX, startY)

  while (walls.length > 0) {
    const idx = Math.floor(Math.random() * walls.length)
    const [nx, ny, px, py] = walls[idx]
    walls.splice(idx, 1)

    if (maze[ny][nx] === 1) {
      maze[ny][nx] = 0
      maze[py][px] = 0
      addWalls(nx, ny)
    }
  }

  // Ensure some open space for Pacman/Ghosts and dots
  for(let i=0; i<height; i++) {
    for(let j=0; j<width; j++) {
      if (maze[i][j] === 0 && Math.random() < 0.1) {
          // Keep as path
      }
    }
  }

  return maze
}

// --- Pacman Game Component ---
const PacmanGame = ({ onGameOver, isDark }: { onGameOver: (score: number) => void, isDark: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(true)

  const gridSize = 20
  const cols = 19, rows = 19
  const mazeRef = useRef<number[][]>([])
  const dotsRef = useRef<boolean[][]>([])
  const pacmanRef = useRef({ x: 1, y: 1, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 } })
  const ghostsRef = useRef([
    { x: 17, y: 17, color: '#ef4444', dir: { x: -1, y: 0 } },
    { x: 17, y: 1, color: '#f97316', dir: { x: 0, y: 1 } },
    { x: 1, y: 17, color: '#06b6d4', dir: { x: 1, y: 0 } },
  ])

  const initGame = useCallback(() => {
    const newMaze = generateMaze(cols, rows)
    mazeRef.current = newMaze
    
    const newDots = newMaze.map((row, y) => 
      row.map((cell, x) => cell === 0 && !(x === 1 && y === 1))
    )
    dotsRef.current = newDots
    
    pacmanRef.current = { x: 1, y: 1, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 } }
    ghostsRef.current = [
      { x: 17, y: 17, color: '#ef4444', dir: { x: -1, y: 0 } },
      { x: 17, y: 1, color: '#f97316', dir: { x: 0, y: 1 } },
      { x: 1, y: 17, color: '#06b6d4', dir: { x: 1, y: 0 } },
    ]
    
    setScore(0)
    setGameOver(false)
    setPaused(true)
  }, [])

  useEffect(() => {
    initGame()
  }, [initGame])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPaused(false)
      switch (e.key) {
        case 'ArrowUp': pacmanRef.current.nextDir = { x: 0, y: -1 }; break
        case 'ArrowDown': pacmanRef.current.nextDir = { x: 0, y: 1 }; break
        case 'ArrowLeft': pacmanRef.current.nextDir = { x: -1, y: 0 }; break
        case 'ArrowRight': pacmanRef.current.nextDir = { x: 1, y: 0 }; break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (gameOver || paused) return

    const tick = setInterval(() => {
      const p = pacmanRef.current
      const maze = mazeRef.current

      // Try next direction
      const nx = p.x + p.nextDir.x
      const ny = p.y + p.nextDir.y
      if (maze[ny]?.[nx] === 0) {
        p.dir = p.nextDir
      }

      // Move in current direction
      const mx = p.x + p.dir.x
      const my = p.y + p.dir.y
      if (maze[my]?.[mx] === 0) {
        p.x = mx
        p.y = my
      }

      // Eat dot
      if (dotsRef.current[p.y][p.x]) {
        dotsRef.current[p.y][p.x] = false
        setScore(s => s + 10)
      }

      // Move ghosts
      ghostsRef.current.forEach(g => {
        const gmz = maze
        // Randomly change direction at intersections
        const possibleDirs = [
          { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
        ].filter(d => gmz[g.y + d.y]?.[g.x + d.x] === 0)

        if (possibleDirs.length > 2 || gmz[g.y + g.dir.y]?.[g.x + g.dir.x] !== 0) {
           g.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)] || g.dir
        }

        g.x += g.dir.x
        g.y += g.dir.y

        // Collision check
        if (g.x === p.x && g.y === p.y) {
          setTimeout(() => {
            setGameOver(true)
            onGameOver(score)
          }, 0)
        }
      })

      // Level complete check
      if (!dotsRef.current.some(row => row.some(d => d))) {
          initGame()
          setScore(s => s + 100)
      }

    }, 150)

    return () => clearInterval(tick)
  }, [gameOver, paused, onGameOver, score, initGame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, 380, 380)
      const maze = mazeRef.current
      if (!maze.length) return

      // Draw walls
      ctx.fillStyle = isDark ? '#1a1a1a' : '#f0f0f0'
      maze.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell === 1) {
            ctx.beginPath()
            ctx.roundRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1, 4)
            ctx.fill()
          }
        })
      })

      // Draw dots
      ctx.fillStyle = isDark ? '#eb4b4b' : '#eb4b4b'
      dotsRef.current.forEach((row, y) => {
        row.forEach((dot, x) => {
          if (dot) {
            ctx.beginPath()
            ctx.arc(x * gridSize + gridSize/2, y * gridSize + gridSize/2, 2, 0, Math.PI * 2)
            ctx.fill()
          }
        })
      })

      // Draw Pacman
      const p = pacmanRef.current
      ctx.fillStyle = '#fde047'
      ctx.beginPath()
      ctx.arc(p.x * gridSize + gridSize/2, p.y * gridSize + gridSize/2, gridSize/2 - 2, 0.2 * Math.PI, 1.8 * Math.PI)
      ctx.lineTo(p.x * gridSize + gridSize/2, p.y * gridSize + gridSize/2)
      ctx.fill()

      // Draw Ghosts
      ghostsRef.current.forEach(g => {
        ctx.fillStyle = g.color
        ctx.beginPath()
        ctx.arc(g.x * gridSize + gridSize/2, g.y * gridSize + gridSize/2 - 2, gridSize/2 - 2, Math.PI, 0)
        ctx.lineTo(g.x * gridSize + gridSize - 4, g.y * gridSize + gridSize - 4)
        ctx.lineTo(g.x * gridSize + 4, g.y * gridSize + gridSize - 4)
        ctx.fill()
        
        // Eyes
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(g.x * gridSize + 6, g.y * gridSize + 8, 2, 0, Math.PI * 2)
        ctx.arc(g.x * gridSize + 14, g.y * gridSize + 8, 2, 0, Math.PI * 2)
        ctx.fill()
      })

      if (paused && !gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.fillRect(0,0,380,380)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 16px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('PRESS ARROW KEYS TO START', 190, 190)
      }

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'
        ctx.fillRect(0,0,380,380)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 24px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', 190, 170)
        ctx.font = '14px monospace'
        ctx.fillText(`SCORE: ${score}`, 190, 200)
      }

      requestAnimationFrame(draw)
    }

    const anim = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(anim)
  }, [isDark, paused, gameOver, score])

  return (
    <div className="relative group">
      <canvas 
        ref={canvasRef} 
        width={380} 
        height={380} 
        className="border-4 border-black dark:border-white rounded-2xl bg-white dark:bg-[#0a0a0a] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]"
      />
      {gameOver && (
        <button 
          onClick={initGame}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-12 bg-white text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform border-2 border-black"
        >
          <RotateCcw size={18} /> RESTART MAZE
        </button>
      )}
    </div>
  )
}

// --- Main Arcade Component ---
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import PatternPicker from "@/components/shared/PatternPicker";
import { BrandMark } from '@/components/shared/BrandMark'
import { Maximize2, Minimize2, Settings2 } from 'lucide-react'

export default function Arcade() {
  const [highScore, setHighScore] = useState(0)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      setTheme(isDark ? 'dark' : 'light')
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  const handleGameOver = (score: number) => {
    if (score > highScore) setHighScore(score)
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  return (
    <div className="flex flex-col items-center w-full max-w-5xl animate-in fade-in zoom-in duration-1000">
      
      <div 
        ref={containerRef}
        className={`
          flex flex-col lg:flex-row items-center gap-12 p-8 transition-all w-full
          ${isFullscreen ? 'bg-white dark:bg-black fixed inset-0 z-[100] justify-center overflow-auto' : ''}
        `}
      >
        {isFullscreen && (
          <div className="fixed top-6 right-6 z-[110] flex gap-3">
             <button 
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Exit Fullscreen"
              >
                <Minimize2 size={18} />
              </button>
          </div>
        )}

        <div className="flex flex-col items-center gap-6 w-full lg:w-auto">
          <div className="text-center">
            <h1 className={`${isFullscreen ? 'text-6xl md:text-8xl' : 'text-7xl md:text-9xl'} font-black tracking-tighter text-black dark:text-white leading-none transition-all`}>
              PAC<span className="text-zinc-300 dark:text-zinc-700">MAN</span>
            </h1>
            {!isFullscreen && (
               <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.4em] mt-4 flex items-center justify-center gap-2">
                <Ghost size={12} className="text-red-500" />
                Error 404: Page Missing
                <Ghost size={12} className="text-cyan-500" />
              </p>
            )}
          </div>

          <PacmanGame onGameOver={handleGameOver} isDark={theme === 'dark'} />
        </div>
        
        <div className={`flex flex-col gap-6 w-full ${isFullscreen ? 'max-w-xs' : 'max-w-xs md:max-w-sm'}`}>
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <Trophy size={20} className="text-amber-500" />
              <h2 className="text-xl font-black uppercase tracking-tight">Records</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-zinc-500">SESSION RECORD</span>
                <span className="font-bold text-lg">{highScore}</span>
              </div>
              <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-zinc-500">LEVEL ID</span>
                <span className="font-bold">PROC-{Math.floor(Math.random() * 9999)}</span>
              </div>
            </div>
          </div>

          <div className="p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] hidden sm:block">
            <div className="flex items-center gap-2 mb-3 text-zinc-400 dark:text-zinc-600">
              <Settings2 size={14} />
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest">Guide</span>
            </div>
            <p className="text-[11px] font-mono text-zinc-500 leading-relaxed uppercase tracking-wider">
              Use your keyboard arrows to navigate the maze. A new layout is generated every time you restart.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
