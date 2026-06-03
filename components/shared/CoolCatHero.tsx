'use client'

import React, { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  speedY: number
  size: number
  color: string
  alpha: number
  life: number // current life status: 0 to 1
  lifeSpeed: number
}

export function CoolCatHero() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mouseRef = useRef({ x: 200, y: 200, targetX: 200, targetY: 200 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const img = new Image()
    img.src = '/logo.png'

    // Particle pool: ~60 particles
    const particles: Particle[] = []
    const initParticle = (p: Partial<Particle> = {}): Particle => {
      const size = Math.random() * 2 + 1
      const lifeSpeed = 0.005 + Math.random() * 0.01
      const g = Math.floor(160 + Math.random() * 80) // 160-240
      const b = Math.floor(50 + Math.random() * 100) // 50-150
      return {
        x: p.x ?? Math.random() * 400,
        y: p.y ?? 400 + Math.random() * 40,
        speedY: p.speedY ?? (0.3 + Math.random() * 0.6),
        size,
        color: `rgba(255, ${g}, ${b},`,
        alpha: 0,
        life: 0,
        lifeSpeed
      }
    }

    for (let i = 0; i < 60; i++) {
      particles.push(initParticle({ y: Math.random() * 400 }))
    }

    // Left and Right Eye center coordinates on the 400x400 canvas
    const leftEye = { x: 148, y: 213 }
    const rightEye = { x: 232, y: 213 }

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 400
      const y = ((e.clientY - rect.top) / rect.height) * 400
      mouseRef.current.targetX = x
      mouseRef.current.targetY = y
    }

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 200
      mouseRef.current.targetY = 200
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', handleMouseLeave)
    }

    let time = 0

    const render = () => {
      time += 0.016 // Approximating 60fps time steps
      ctx.clearRect(0, 0, 400, 400)

      // 1. Lerp mouse positions for smooth parallax tilt
      const mouse = mouseRef.current
      mouse.x += (mouse.targetX - mouse.x) * 0.1
      mouse.y += (mouse.targetY - mouse.y) * 0.1

      const dx = ((mouse.x - 200) / 200) * 6
      const dy = ((mouse.y - 200) / 200) * 6

      // 2. Ambient glow (Behind the cat)
      ctx.save()
      const ambientPulse = Math.sin(time * 0.7) * 0.03 + 0.12
      const ambientGrad = ctx.createRadialGradient(200, 200, 50, 200, 200, 200)
      ambientGrad.addColorStop(0, `rgba(255, 160, 30, ${ambientPulse})`)
      ambientGrad.addColorStop(1, 'rgba(255, 160, 30, 0)')
      ctx.fillStyle = ambientGrad
      ctx.fillRect(0, 0, 400, 400)
      ctx.restore()

      // 3. Draw Cat Image with Parallax tilt
      ctx.save()
      ctx.translate(dx, dy)
      if (img.complete) {
        // Draw centered
        ctx.drawImage(img, 200 - 150, 200 - 150, 300, 300)
      } else {
        // Fallback cat avatar shape if image is loading
        ctx.beginPath()
        ctx.arc(200, 200, 80, 0, Math.PI * 2)
        ctx.fillStyle = '#222'
        ctx.fill()
      }
      ctx.restore()

      // Helper for Lens Glint Effect
      const drawGlint = (eyeX: number, eyeY: number, offset: number) => {
        ctx.save()
        ctx.translate(dx, dy)

        // Clip to eye ellipse (radius 36 width, 16 height)
        ctx.beginPath()
        ctx.ellipse(eyeX, eyeY, 36, 16, 0, 0, Math.PI * 2)
        ctx.clip()

        // Sweep gradient horizontally
        const sweepX = eyeX + Math.sin(time * 1.1 + offset) * 70
        const sweepGrad = ctx.createLinearGradient(sweepX - 20, eyeY, sweepX + 20, eyeY)
        sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0)')
        sweepGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)')
        sweepGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = sweepGrad
        ctx.fillRect(eyeX - 40, eyeY - 20, 80, 40)

        // Vertical stripe crossing it
        const sweepY = eyeY + Math.cos(time * 1.1 + offset) * 30
        const vertGrad = ctx.createLinearGradient(eyeX, sweepY - 10, eyeX, sweepY + 10)
        vertGrad.addColorStop(0, 'rgba(255, 255, 255, 0)')
        vertGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)')
        vertGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = vertGrad
        ctx.fillRect(eyeX - 40, eyeY - 20, 80, 40)

        ctx.restore()
      }

      // Draw left & right lens glints
      drawGlint(leftEye.x, leftEye.y, 0)
      drawGlint(rightEye.x, rightEye.y, Math.PI / 2)

      // Helper for Lens Flare Burst Effect
      const drawFlareBurst = (eyeX: number, eyeY: number, phaseOffset: number) => {
        ctx.save()
        // Follow eye position with parallax
        const fx = eyeX + dx
        const fy = eyeY + dy

        // Flare alpha pulses
        const alpha = Math.pow(Math.sin(time * 1.5 + phaseOffset) * 0.5 + 0.5, 2) * 0.85

        if (alpha > 0.05) {
          // Radial halo glow
          const flareGrad = ctx.createRadialGradient(fx, fy, 2, fx, fy, 45)
          flareGrad.addColorStop(0, `rgba(255, 240, 180, ${alpha * 0.8})`)
          flareGrad.addColorStop(0.2, `rgba(255, 180, 100, ${alpha * 0.4})`)
          flareGrad.addColorStop(1, 'rgba(255, 180, 100, 0)')
          ctx.fillStyle = flareGrad
          ctx.beginPath()
          ctx.arc(fx, fy, 45, 0, Math.PI * 2)
          ctx.fill()

          // Draw 8 rotating rays
          ctx.strokeStyle = `rgba(255, 220, 140, ${alpha * 0.6})`
          ctx.lineWidth = 1.5
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time * 0.3 + phaseOffset
            const len = 30 + Math.sin(time * 5 + i) * 8
            ctx.beginPath()
            ctx.moveTo(fx, fy)
            ctx.lineTo(fx + Math.cos(angle) * len, fy + Math.sin(angle) * len)
            ctx.stroke()
          }
        }
        ctx.restore()
      }

      // Draw flares
      drawFlareBurst(leftEye.x, leftEye.y, 0)
      drawFlareBurst(rightEye.x, rightEye.y, Math.PI)

      // 4. Draw Floating Particles
      particles.forEach((p, idx) => {
        p.y -= p.speedY
        p.life += p.lifeSpeed

        // Lifecycle: Fade in -> hold -> fade out
        if (p.life < 0.2) {
          p.alpha = p.life / 0.2
        } else if (p.life > 0.8) {
          p.alpha = (1 - p.life) / 0.2
        } else {
          p.alpha = 1
        }

        // Depth layering parallax shift
        const px = p.x + dx * 0.3

        ctx.beginPath()
        ctx.arc(px, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color + (p.alpha * 0.65).toFixed(2) + ')'
        ctx.fill()

        // Reset if finished or out of bounds
        if (p.life >= 1 || p.y < -10) {
          particles[idx] = initParticle()
        }
      })

      // 5. Vignette (Darken edges)
      ctx.save()
      const vignetteGrad = ctx.createRadialGradient(200, 200, 80, 200, 200, 280)
      vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)')
      vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = vignetteGrad
      ctx.fillRect(0, 0, 400, 400)
      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square max-w-[400px] flex items-center justify-center rounded-[2.5rem] overflow-hidden bg-[#080808] border border-zinc-800 shadow-2xl transition-all"
    >
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  )
}
