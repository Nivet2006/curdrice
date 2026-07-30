'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Play, Pause, RotateCcw, CheckSquare, Plus, Check } from 'lucide-react'

export function PomodoroTimerTool() {
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)

  const [tasks, setTasks] = useState([
    { id: '1', text: 'Solve 2 LeetCode Medium DSA problems', done: true },
    { id: '2', text: 'Optimize ATS Resume Keywords', done: false },
    { id: '3', text: 'Review Next.js Server Components architecture', done: false }
  ])
  const [newTaskText, setNewTaskText] = useState('')

  useEffect(() => {
    let timer: any = null
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      if (mode === 'work') {
        setCompletedSessions(prev => prev + 1)
      }
    }
    return () => clearInterval(timer)
  }, [isRunning, timeLeft, mode])

  const handleModeChange = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    setMode(newMode)
    setIsRunning(false)
    if (newMode === 'work') setTimeLeft(25 * 60)
    else if (newMode === 'shortBreak') setTimeLeft(5 * 60)
    else setTimeLeft(15 * 60)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleAddTask = () => {
    if (!newTaskText.trim()) return
    setTasks([...tasks, { id: Date.now().toString(), text: newTaskText.trim(), done: false }])
    setNewTaskText('')
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  return (
    <div className="space-y-6 font-mono text-zinc-900 dark:text-white">
      {/* Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-black rounded-xl font-bold shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase font-mono">Pomodoro Study Planner &amp; Focus Timer</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Boost productivity with 25-minute deep focus intervals and organized task checklists.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold uppercase text-zinc-400">Sessions</span>
          <p className="text-xl font-black text-amber-500">{completedSessions} Completed</p>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl text-center space-y-6 text-white shadow-2xl">
        {/* Mode Selector */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handleModeChange('work')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase ${
              mode === 'work' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Focus (25m)
          </button>
          <button
            onClick={() => handleModeChange('shortBreak')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase ${
              mode === 'shortBreak' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Short Break (5m)
          </button>
          <button
            onClick={() => handleModeChange('longBreak')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase ${
              mode === 'longBreak' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Large Digital Clock */}
        <div className="text-6xl sm:text-8xl font-black font-mono tracking-tighter text-amber-400 py-2">
          {formatTime(timeLeft)}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase text-xs rounded-2xl shadow-xl flex items-center gap-2"
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
            {isRunning ? 'Pause Focus' : 'Start Focus'}
          </button>

          <button
            onClick={() => {
              setIsRunning(false)
              handleModeChange(mode)
            }}
            className="px-4 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-xs rounded-2xl border border-zinc-700"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Task Checklist */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">Session Goal Checklist</h4>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="Add a new study or coding task..."
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
          />
          <button
            onClick={handleAddTask}
            className="px-4 py-3 bg-amber-500 text-black font-bold uppercase text-xs rounded-xl shrink-0 flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`p-3 border rounded-xl flex items-center gap-3 cursor-pointer text-xs font-mono transition-all ${
                task.done
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-zinc-400 line-through'
                  : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                task.done ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-400'
              }`}>
                {task.done && <Check size={12} />}
              </div>
              <span>{task.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
