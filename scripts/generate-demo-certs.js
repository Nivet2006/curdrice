const fs = require('fs')
const path = require('path')
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib')

async function createCertificatePdf(certificateId, recipientName, eventName) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([800, 600])

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Draw background & border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: 760,
    height: 560,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 4,
    color: rgb(0.98, 0.98, 0.98),
  })

  page.drawRectangle({
    x: 30,
    y: 30,
    width: 740,
    height: 540,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1.5,
  })

  // Title: ONE PERCENT CLUB
  page.drawText(eventName.toUpperCase(), {
    x: 240,
    y: 480,
    size: 28,
    font: helveticaBold,
    color: rgb(0.05, 0.05, 0.05),
  })

  // Subtitle
  page.drawText('CERTIFICATE OF PARTICIPATION', {
    x: 260,
    y: 430,
    size: 16,
    font: helveticaBold,
    color: rgb(0.4, 0.4, 0.4),
  })

  // Presented To Text
  page.drawText('This certificate is proudly presented to', {
    x: 275,
    y: 360,
    size: 14,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3),
  })

  // Recipient Name
  page.drawText(recipientName, {
    x: 300,
    y: 300,
    size: 32,
    font: helveticaBold,
    color: rgb(0, 0.4, 0.8),
  })

  // Line decoration
  page.drawLine({
    start: { x: 200, y: 280 },
    end: { x: 600, y: 280 },
    thickness: 2,
    color: rgb(0.8, 0.8, 0.8),
  })

  // Event completion description
  page.drawText(`for successfully participating in the ${eventName} Program.`, {
    x: 220,
    y: 230,
    size: 14,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3),
  })

  // Certificate ID Footer
  page.drawText(`Certificate ID: ${certificateId}`, {
    x: 60,
    y: 60,
    size: 12,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  })

  // Date
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  page.drawText(`Issued: ${dateStr}`, {
    x: 620,
    y: 60,
    size: 12,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

async function generateAllDemoFiles() {
  const outputDir = path.join(__dirname, '..', 'public', 'demo-certificates')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const participants = [
    { certId: 'CERT-001', name: 'Rahul Kumar', email: 'rahul@gmail.com', filename: 'CERT-001.pdf' },
    { certId: 'CERT-002', name: 'Ananya Sharma', email: 'ananya@gmail.com', filename: 'CERT-002.pdf' },
    { certId: 'CERT-003', name: 'Arjun Kumar', email: 'arjun@gmail.com', filename: 'CERT-003.pdf' },
    { certId: 'CERT-004', name: 'Priya Patel', email: 'priya@gmail.com', filename: 'Rahul_Kumar.pdf' }, // Test secondary name matching
    { certId: 'CERT-005', name: 'Vikram Singh', email: 'vikram@gmail.com', filename: 'CERT-005.pdf' },
  ]

  // 1. Generate PDFs
  for (const p of participants) {
    const pdfBytes = await createCertificatePdf(p.certId, p.name, 'One Percent Club')
    const filePath = path.join(outputDir, p.filename)
    fs.writeFileSync(filePath, pdfBytes)
    console.log(`Generated PDF: ${filePath}`)
  }

  // 2. Generate CSV
  const csvLines = [
    'name,email,certificate_id,event',
    ...participants.map((p) => `"${p.name}","${p.email}","${p.certId}","One Percent Club"`),
  ]
  const csvContent = csvLines.join('\n')
  const csvPath = path.join(outputDir, 'sample_participants.csv')
  fs.writeFileSync(csvPath, csvContent)
  console.log(`Generated CSV: ${csvPath}`)

  // Also write sample_participants.csv to project root for easy access
  const rootCsvPath = path.join(__dirname, '..', 'sample_participants.csv')
  fs.writeFileSync(rootCsvPath, csvContent)
  console.log(`Generated Root CSV: ${rootCsvPath}`)
}

generateAllDemoFiles().catch(console.error)
