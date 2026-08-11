import QRCode from 'qrcode'

export interface QRCanvasOptions {
  text: string
  fgColor?: string
  bgColor?: string
  transparentBg?: boolean
  logoSrc?: string
  logoRatio?: number // Ratio relative to QR width, e.g. 0.22
  logoPadding?: number
  size?: number
}

/**
  Draws a QR Code onto an HTML Canvas element with support for:
  - Custom dark/light colors
  - Transparent backgrounds
  - Centered logo with clear contrast padding
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
    logoRatio = 0.22,
    logoPadding = 6,
    size = 1000,
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
        // Render rounded module cells for a sleek modern aesthetic
        ctx.fillRect(x, y, cellSize + 0.5, cellSize + 0.5)
      }
    }
  }

  // 4. Draw Logo in Center if logoSrc is provided
  if (logoSrc) {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const logoSize = size * logoRatio
        const logoX = (size - logoSize) / 2
        const logoY = (size - logoSize) / 2
        const totalPad = logoPadding * (size / 500)

        // Draw background badge behind logo for high contrast & readability
        ctx.fillStyle = transparentBg ? (bgColor !== 'transparent' ? bgColor : '#FFFFFF') : bgColor
        ctx.beginPath()
        const borderRadius = (logoSize + totalPad * 2) * 0.2
        const padX = logoX - totalPad
        const padY = logoY - totalPad
        const padW = logoSize + totalPad * 2
        const padH = logoSize + totalPad * 2

        ctx.roundRect(padX, padY, padW, padH, borderRadius)
        ctx.fill()

        // Draw Logo Image inside rounded clip
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(logoX, logoY, logoSize, logoSize, borderRadius * 0.75)
        ctx.clip()
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize)
        ctx.restore()

        resolve()
      }
      img.onerror = () => {
        // If image fails to load, gracefully resolve
        resolve()
      }
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
