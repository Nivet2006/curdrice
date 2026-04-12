import QRCode from 'qrcode'

export async function generateBrandedQR(
  token: string,
  studentName: string
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 300
  canvas.height = 340

  await QRCode.toCanvas(canvas, `Club-Eve://checkin?token=${token}`, {
    width: 300,
    margin: 2,
    color: { dark: '#0a0a0a', light: '#ffffff' },
  })

  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 300, 300, 40)

  ctx.fillStyle = '#6b6b6b'
  ctx.font = '13px "JetBrains Mono", monospace'
  ctx.textAlign = 'left'
  ctx.fillText('|||··||', 12, 326)

  ctx.fillStyle = '#0a0a0a'
  ctx.font = '11px Inter, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(studentName, 288, 326)

  return canvas.toDataURL('image/png')
}
