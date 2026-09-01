import QRCode from 'qrcode'

export type LogoBgStyle =
  | 'adaptive'
  | 'none'
  | 'square'
  | 'rounded'
  | 'circle'
  | 'pill'
  | 'outline'
  | 'soft'
  | 'frosted'
  | 'inverted'
  | 'gradient'

export type GradientDirection = 'horizontal' | 'vertical' | 'diagonal'

export interface AdvancedLogoOptions {
  bgStyle?: LogoBgStyle
  bgColorMode?: 'auto' | 'white' | 'black' | 'custom'
  customBgColor?: string
  opacity?: number // 0.0 - 1.0
  padding?: number // in px (e.g. 0-40)
  radius?: number // in px (corner radius)
  borderWidth?: number // in px
  borderColorMode?: 'auto' | 'white' | 'black' | 'custom'
  customBorderColor?: string
  gradientStart?: string
  gradientEnd?: string
  gradientDirection?: GradientDirection
}

export interface QRCanvasOptions {
  text: string
  fgColor?: string
  bgColor?: string
  transparentBg?: boolean
  logoSrc?: string
  logoRatio?: number // Ratio relative to QR width, e.g. 0.22
  logoPadding?: number
  logoRotation?: number // Angle in degrees to rotate logo around its center
  size?: number
  showLogoBg?: boolean
  logoOpacity?: number
  logoGlow?: boolean
  logoGlowColor?: string
  logoGlowBlur?: number
  // Advanced branding options
  advancedLogo?: AdvancedLogoOptions
}

export interface ReadabilityResult {
  status: 'SAFE' | 'WARNING' | 'HIGH_RISK'
  coveragePercent: number
  message: string
}

/**
 * Calculates luminance of a color string (hex format like #ffffff or #000000)
 */
export function getLuminance(hexOrColor: string): number {
  if (!hexOrColor || hexOrColor === 'transparent') return 1
  let c = hexOrColor.trim().replace('#', '')
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('')
  }
  if (c.length !== 6) return 1
  const r = parseInt(c.substring(0, 2), 16) / 255
  const g = parseInt(c.substring(2, 4), 16) / 255
  const b = parseInt(c.substring(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * QR readability & safety analysis helper
 */
export function analyzeQRReadability(
  logoRatio: number,
  padding: number,
  rotation: number,
  bgStyle: LogoBgStyle = 'adaptive'
): ReadabilityResult {
  // Proportional padding based on logo height factor
  const effectivePaddingRatio = (padding / 100) * logoRatio * 0.4
  let effectiveWidthRatio = logoRatio + effectivePaddingRatio
  let effectiveHeightRatio = (logoRatio / 2.5) + effectivePaddingRatio // TEDx aspect ratio ~ 2.5:1

  if (bgStyle === 'circle') {
    const circleDiamRatio = Math.hypot(effectiveWidthRatio, effectiveHeightRatio)
    effectiveWidthRatio = circleDiamRatio
    effectiveHeightRatio = circleDiamRatio
  }

  const rad = (Math.abs(rotation) * Math.PI) / 180
  const boundingW = Math.abs(effectiveWidthRatio * Math.cos(rad)) + Math.abs(effectiveHeightRatio * Math.sin(rad))
  const boundingH = Math.abs(effectiveWidthRatio * Math.sin(rad)) + Math.abs(effectiveHeightRatio * Math.cos(rad))

  const coverageArea = (bgStyle === 'circle')
    ? (Math.PI * Math.pow(effectiveWidthRatio / 2, 2))
    : (boundingW * boundingH)
  const coveragePercent = Math.round(coverageArea * 100)

  if (coveragePercent <= 14 && boundingW <= 0.35 && boundingH <= 0.35) {
    return {
      status: 'SAFE',
      coveragePercent,
      message: 'Logo & badge area are well within high error-correction capacity (Level H: 30%).'
    }
  } else if (coveragePercent <= 24 && boundingW <= 0.42 && boundingH <= 0.42) {
    return {
      status: 'WARNING',
      coveragePercent,
      message: 'Logo covers significant QR modules. Scannability maintained by Level H error recovery.'
    }
  } else {
    return {
      status: 'HIGH_RISK',
      coveragePercent,
      message: 'High risk of scan failure! Reduce logo size, padding, or rotation angle.'
    }
  }
}

/**
  Draws a QR Code onto an HTML Canvas element with support for:
  - Custom dark/light colors
  - Transparent backgrounds
  - Centered logo with clear contrast padding and ratio preservation
  - Centered logo rotation
  - Advanced TEDx logo background styles & badge shapes
  - Optional logo glow & opacity
 */
export async function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  options: QRCanvasOptions
): Promise<void> {
  const {
    text,
    fgColor = '#000000',
    bgColor = '#FFFFFF',
    transparentBg = false,
    logoSrc = '/logo.png',
    logoRatio = 0.16,
    logoPadding = 10,
    logoRotation = 15,
    size = 1000,
    showLogoBg = false,
    logoOpacity = 1.0,
    logoGlow = false,
    logoGlowColor = '#3b82f6',
    logoGlowBlur = 20,
    advancedLogo
  } = options

  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 1. Generate QR Code module layout using high error correction (H level for logo tolerance)
  const qrData = QRCode.create(text, { errorCorrectionLevel: 'H' })
  const modules = qrData.modules
  const moduleCount = modules.size
  const cellSize = size / moduleCount

  ctx.clearRect(0, 0, size, size)

  // 2. Draw Background (unless transparent mode is active)
  if (!transparentBg) {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, size, size)
  }

  // 3. Draw QR Modules (Foreground cells)
  ctx.fillStyle = fgColor

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (modules.get(r, c)) {
        const x = c * cellSize
        const y = r * cellSize
        ctx.fillRect(x, y, cellSize + 0.5, cellSize + 0.5)
      }
    }
  }

  // 4. Draw Logo & Background Badge in Center if logoSrc is provided
  if (logoSrc) {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const naturalWidth = img.naturalWidth || 1
        const naturalHeight = img.naturalHeight || 1
        const aspect = naturalWidth / naturalHeight

        // Preserve original horizontal logo aspect ratio
        let logoW = size * logoRatio
        let logoH = logoW / aspect

        const centerX = size / 2
        const centerY = size / 2

        // Proportional padding derived from logo dimensions rather than arbitrary fixed canvas pixels
        // default padding range maps 0-24px nicely scaled to canvas size
        const rawPaddingVal = advancedLogo?.padding !== undefined ? advancedLogo.padding : logoPadding
        const padPx = Math.max(2, (rawPaddingVal / 250) * size)

        const bgStyle: LogoBgStyle = advancedLogo?.bgStyle || (showLogoBg ? 'rounded' : 'none')

        const isCanvasDark = transparentBg
          ? getLuminance(fgColor) > 0.5
          : getLuminance(bgColor) < 0.5

        // Calculate badge dimensions based directly on rendered logo dimensions
        let padW = logoW + padPx * 2
        let padH = logoH + padPx * 2

        if (bgStyle === 'pill') {
          // Compact horizontal pill around TEDx logo
          padW = logoW + padPx * 2.5
          padH = logoH + padPx * 1.8
        }

        ctx.save()
        // Geometric center translation
        ctx.translate(centerX, centerY)
        if (logoRotation !== 0) {
          ctx.rotate((logoRotation * Math.PI) / 180)
        }

        // Determine Badge Color
        let resolvedBgColor = isCanvasDark ? '#141414' : '#FFFFFF'
        if (advancedLogo?.bgColorMode === 'custom' && advancedLogo?.customBgColor) {
          resolvedBgColor = advancedLogo.customBgColor
        } else if (advancedLogo?.bgColorMode === 'white') {
          resolvedBgColor = '#FFFFFF'
        } else if (advancedLogo?.bgColorMode === 'black') {
          resolvedBgColor = '#141414'
        } else {
          if (bgStyle === 'inverted') {
            resolvedBgColor = isCanvasDark ? '#FFFFFF' : '#141414'
          } else {
            resolvedBgColor = isCanvasDark ? '#141414' : '#FFFFFF'
          }
        }

        const defaultOpacity = bgStyle === 'soft' ? 0.7 : bgStyle === 'frosted' ? 0.85 : 1.0
        const resolvedOpacity = advancedLogo?.opacity !== undefined
          ? advancedLogo.opacity
          : defaultOpacity

        // Corner radius calculation proportional to badge height
        const defaultRadius = Math.min(padH * 0.35, padW * 0.35)
        const rawRadius = advancedLogo?.radius !== undefined
          ? (advancedLogo.radius / 100) * padH
          : defaultRadius
        const resolvedRadius = Math.min(rawRadius, padH / 2, padW / 2)

        // Render Background Protection Badge
        if (bgStyle !== 'none') {
          ctx.save()
          ctx.globalAlpha = Math.max(0, Math.min(1, resolvedOpacity))

          if (bgStyle === 'square') {
            ctx.fillStyle = resolvedBgColor
            ctx.fillRect(-padW / 2, -padH / 2, padW, padH)
          } else if (bgStyle === 'rounded' || bgStyle === 'soft' || bgStyle === 'inverted' || bgStyle === 'adaptive') {
            ctx.fillStyle = resolvedBgColor
            ctx.beginPath()
            ctx.roundRect(-padW / 2, -padH / 2, padW, padH, resolvedRadius)
            ctx.fill()
          } else if (bgStyle === 'circle') {
            const circleRadius = Math.hypot(padW, padH) / 2
            ctx.fillStyle = resolvedBgColor
            ctx.beginPath()
            ctx.arc(0, 0, circleRadius, 0, Math.PI * 2)
            ctx.fill()
          } else if (bgStyle === 'pill') {
            const pillRadius = padH / 2
            ctx.fillStyle = resolvedBgColor
            ctx.beginPath()
            ctx.roundRect(-padW / 2, -padH / 2, padW, padH, pillRadius)
            ctx.fill()
          } else if (bgStyle === 'outline') {
            const borderW = Math.max(1, ((advancedLogo?.borderWidth ?? 2) / 500) * size)
            let borderCol = isCanvasDark ? '#FFFFFF' : '#0a0a0a'
            if (advancedLogo?.borderColorMode === 'custom' && advancedLogo?.customBorderColor) {
              borderCol = advancedLogo.customBorderColor
            } else if (advancedLogo?.borderColorMode === 'white') borderCol = '#FFFFFF'
            else if (advancedLogo?.borderColorMode === 'black') borderCol = '#141414'

            ctx.lineWidth = borderW
            ctx.strokeStyle = borderCol
            ctx.beginPath()
            ctx.roundRect(-padW / 2, -padH / 2, padW, padH, resolvedRadius)
            ctx.stroke()
          } else if (bgStyle === 'frosted') {
            ctx.fillStyle = resolvedBgColor
            ctx.beginPath()
            ctx.roundRect(-padW / 2, -padH / 2, padW, padH, resolvedRadius)
            ctx.fill()
            ctx.strokeStyle = isCanvasDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
            ctx.lineWidth = Math.max(1, (1.5 / 500) * size)
            ctx.stroke()
          } else if (bgStyle === 'gradient') {
            const gStart = advancedLogo?.gradientStart || '#eb0028'
            const gEnd = advancedLogo?.gradientEnd || '#000000'
            const gDir = advancedLogo?.gradientDirection || 'diagonal'
            let grad: CanvasGradient
            if (gDir === 'horizontal') {
              grad = ctx.createLinearGradient(-padW / 2, 0, padW / 2, 0)
            } else if (gDir === 'vertical') {
              grad = ctx.createLinearGradient(0, -padH / 2, 0, padH / 2)
            } else {
              grad = ctx.createLinearGradient(-padW / 2, -padH / 2, padW / 2, padH / 2)
            }
            grad.addColorStop(0, gStart)
            grad.addColorStop(1, gEnd)

            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.roundRect(-padW / 2, -padH / 2, padW, padH, resolvedRadius)
            ctx.fill()
          }

          ctx.restore()
        }

        // Draw Logo Image (Opaque, visual focal point)
        ctx.save()
        ctx.globalAlpha = Math.max(0, Math.min(1, logoOpacity))

        if (logoGlow) {
          ctx.shadowColor = logoGlowColor || '#3b82f6'
          ctx.shadowBlur = logoGlowBlur * (size / 500)
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
        }

        ctx.drawImage(img, -logoW / 2, -logoH / 2, logoW, logoH)
        ctx.restore()

        ctx.restore()
        resolve()
      }
      img.onerror = () => resolve()
      img.src = logoSrc
    })
  }
}

/**
 * Utility to download canvas content as PNG file (with or without background)
 */
export function downloadCanvasAsImage(
  canvas: HTMLCanvasElement,
  filename: string = 'clubeve-qr.png'
) {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}


