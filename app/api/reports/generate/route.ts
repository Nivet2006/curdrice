import { createClient } from '@/lib/supabase/server';
import { reportsClient } from '@/lib/supabase/reports-client';
import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load logos from public/iic/ at startup (server-side only)
// Place your files at:
//   public/iic/gcem-crest.png
//   public/iic/iic-logo.png
function loadLogoBytes(filename: string): Buffer | null {
  const filePath = join(process.cwd(), 'public', 'iic', filename);
  if (existsSync(filePath)) {
    return readFileSync(filePath);
  }
  console.warn(`[PDF] Logo not found at ${filePath} — skipping.`);
  return null;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { eventId, ...reportData } = data;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // -------------------------------------------------------------
    // GENERATE PDF using pdf-lib
    // -------------------------------------------------------------
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Load logos from public/iic/
    const gcemBytes = loadLogoBytes('gcem-crest.png');
    const iicBytes = loadLogoBytes('iic-logo.png');
    const gcemImage = gcemBytes ? await pdfDoc.embedPng(gcemBytes) : null;
    const iicImage  = iicBytes  ? await pdfDoc.embedPng(iicBytes)  : null;

    const addLetterheadPage = () => {
       const page = pdfDoc.addPage([595.28, 841.89]); // A4
       const { width, height } = page.getSize();

       // ── WHITE BACKGROUND (fill entire page) ──
       page.drawRectangle({
          x: 0, y: 0, width, height,
          color: rgb(1, 1, 1),  // solid white
       });
       
       // Double border
       page.drawRectangle({
          x: 10, y: 10, width: width - 20, height: height - 20,
          borderWidth: 2, borderColor: rgb(0.06, 0.06, 0.06),
       });
       page.drawRectangle({
          x: 14, y: 14, width: width - 28, height: height - 28,
          borderWidth: 1, borderColor: rgb(0.06, 0.06, 0.06),
       });

       // GCEM Logo (left)
       if (gcemImage) {
         page.drawImage(gcemImage, { x: 30, y: height - 90, width: 60, height: 60 });
       }
       page.drawText("GOPALAN", { x: 100, y: height - 50, font: fontBold, size: 18, color: rgb(0.1, 0.1, 0.18) });
       page.drawText("COLLEGE OF ENGINEERING", { x: 100, y: height - 65, font: font, size: 10, color: rgb(0.1, 0.1, 0.18) });
       page.drawText("AND MANAGEMENT", { x: 100, y: height - 77, font: font, size: 10, color: rgb(0.1, 0.1, 0.18) });
       page.drawText("Whitefield, Bengaluru", { x: 100, y: height - 89, font: font, size: 8, color: rgb(0.1, 0.1, 0.18) });

       // IIC Logo (right)
       if (iicImage) {
         page.drawImage(iicImage, { x: width - 80, y: height - 90, width: 50, height: 50 });
       }
       page.drawText("INSTITUTION'S INNOVATION COUNCIL", { x: width - 300, y: height - 50, font: fontBold, size: 11, color: rgb(0.12, 0.22, 0.54) });
       page.drawText("(Ministry of HRD Initiative)", { x: width - 230, y: height - 65, font: fontItalic, size: 9, color: rgb(0.12, 0.22, 0.54) });

       // Divider
       page.drawLine({
          start: { x: 20, y: height - 100 },
          end: { x: width - 20, y: height - 100 },
          thickness: 1,
          color: rgb(0.1, 0.1, 0.1)
       });

       return page;
    };

    // Page 1
    let page = addLetterheadPage();
    let currentY = 700;

    const drawRow = (label: string, value: string) => {
       if (currentY < 100) {
          page = addLetterheadPage();
          currentY = 700;
       }
       page.drawText(label, { x: 40, y: currentY, font: fontBold, size: 11 });
       // Simple text wrap (naive)
       const wrapped = value ? value.toString().substring(0, 100) + (value.toString().length > 100 ? '...' : '') : 'N/A';
       page.drawText(wrapped, { x: 200, y: currentY, font: font, size: 11 });
       currentY -= 30;
    };

    drawRow("1. Activity Name", reportData.activity_name);
    drawRow("2. Thrust Area", reportData.thrust_area);
    drawRow("3. Level of Activity", reportData.level);
    drawRow("4. Semester", reportData.semester);
    drawRow("5. Quarter", reportData.quarter);
    drawRow("6. Date of Event", reportData.event_date);
    drawRow("7. Duration (mins)", String(reportData.duration_minutes));
    drawRow("8. Faculty Count", String(reportData.faculty_count));
    drawRow("9. Student Count", String(reportData.student_count));
    drawRow("10. Funds Utilized", String(reportData.funds_used));
    drawRow("11. Department", reportData.department);
    drawRow("12. Objective", reportData.objective);
    drawRow("13. Summary", reportData.summary);
    drawRow("14. Benefits", reportData.benefits);

    // Page 2 - Signature Row
    page = addLetterheadPage();
    currentY = 700;
    // Resource Persons
    drawRow("15. Resource Persons:", "");
    if (reportData.resource_persons && reportData.resource_persons.length > 0) {
       reportData.resource_persons.forEach((rp: any, idx: number) => {
          if (currentY < 150) {
             page = addLetterheadPage();
             currentY = 700;
          }
          const isInternal = reportData.level === 'Institute' || reportData.level === 'Department';
          page.drawText(`[Person ${idx + 1}]`, { x: 50, y: currentY, font: fontBold, size: 10 });
          currentY -= 20;
          
          if (isInternal) {
             page.drawText(`Name: ${rp.name || 'N/A'}, USN: ${rp.usn || 'N/A'}, Dept: ${rp.department || 'N/A'}`, { x: 60, y: currentY, font: font, size: 10 });
             currentY -= 20;
             page.drawText(`Mobile: ${rp.mobile || 'N/A'}, Email: ${rp.email || 'N/A'}`, { x: 60, y: currentY, font: font, size: 10 });
             currentY -= 30;
          } else {
             page.drawText(`Name: ${rp.name || 'N/A'}, Org: ${rp.organization || 'N/A'}, Desig: ${rp.designation || 'N/A'}`, { x: 60, y: currentY, font: font, size: 10 });
             currentY -= 20;
             page.drawText(`Mobile: ${rp.mobile || 'N/A'}, Email: ${rp.email || 'N/A'}`, { x: 60, y: currentY, font: font, size: 10 });
             currentY -= 20;
             page.drawText(`Address: ${rp.address || 'N/A'}`, { x: 60, y: currentY, font: font, size: 10 });
             currentY -= 30;
          }
       });
    }

    // Social Links
    drawRow("19. Instagram", reportData.instagram_link);
    drawRow("19. Facebook", reportData.facebook_link);
    drawRow("19. Twitter", reportData.twitter_link);
    
    // Coordinators
    drawRow("21. Faculty Coordinators", (reportData.faculty_coordinators || []).join(', '));
    drawRow("22. Student Coordinators", (reportData.student_coordinators || []).join(', '));

    // Signatures
    currentY = 150;
    page.drawLine({ start: { x: 50, y: currentY }, end: { x: 180, y: currentY }, thickness: 1 });
    page.drawLine({ start: { x: 230, y: currentY }, end: { x: 360, y: currentY }, thickness: 1 });
    page.drawLine({ start: { x: 410, y: currentY }, end: { x: 540, y: currentY }, thickness: 1 });
    
    page.drawText("Prepared By", { x: 80, y: currentY - 15, font: fontBold, size: 10 });
    page.drawText("Faculty Coordinator", { x: 70, y: currentY - 30, font: font, size: 9 });

    page.drawText("Verified by", { x: 270, y: currentY - 15, font: fontBold, size: 10 });
    page.drawText("Department HoD", { x: 260, y: currentY - 30, font: font, size: 9 });

    page.drawText("Approved by", { x: 450, y: currentY - 15, font: fontBold, size: 10 });
    page.drawText("IIC President", { x: 455, y: currentY - 30, font: font, size: 9 });

    // Page 3 - Photo Collages
    if (reportData.photo_1_url || reportData.photo_2_url) {
       page = addLetterheadPage();
       page.drawText("Photo Collages", { x: 40, y: 700, font: fontBold, size: 14 });
       
       const drawRemoteImage = async (url: string, yPos: number) => {
         try {
           const res = await fetch(url);
           if (!res.ok) throw new Error(`HTTP ${res.status}`);
           const imageBytes = await res.arrayBuffer();
           
           let img;
           try {
             img = await pdfDoc.embedJpg(imageBytes);
           } catch {
             img = await pdfDoc.embedPng(imageBytes);
           }
           
           if (img) {
             const dims = img.scaleToFit(500, 250);
             page.drawImage(img, {
               x: (595.28 - dims.width) / 2, // center horizontal
               y: yPos - dims.height,
               width: dims.width,
               height: dims.height,
             });
           }
         } catch (e) {
           console.error("Failed to load image from URL", url, e);
           page.drawText(`[Image failed to load: Ensure link is direct & publicly accessible]`, { x: 40, y: yPos - 20, font: fontItalic, size: 10, color: rgb(0.8, 0.2, 0.2) });
         }
       };

       if (reportData.photo_1_url) await drawRemoteImage(reportData.photo_1_url, 650);
       if (reportData.photo_2_url) await drawRemoteImage(reportData.photo_2_url, 350);
    }

    const pdfBytes = await pdfDoc.save();

    // -------------------------------------------------------------
    // UPLOAD TO SECOND (REPORTS) SUPABASE DB
    // -------------------------------------------------------------
    const timestamp = new Date().getTime();
    const filePath = `${eventId}/${timestamp}_report.pdf`;

    const { error: uploadError } = await reportsClient
      .storage
      .from('iic-reports')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('[PDF Upload Error]', uploadError);
      return NextResponse.json({ error: `Failed to upload PDF: ${uploadError.message}` }, { status: 500 });
    }

    // Get a long-lived signed URL (30 days)
    const { data: signedData } = await reportsClient
      .storage
      .from('iic-reports')
      .createSignedUrl(filePath, 60 * 60 * 24 * 30);

    const pdfUrl = signedData?.signedUrl || '';

    // Build the report row
    const reportRow = {
      event_id: eventId,
      created_by: user.id,
      department: reportData.department,
      activity_name: reportData.activity_name,
      thrust_area: reportData.thrust_area,
      level: reportData.level,
      semester: reportData.semester,
      quarter: reportData.quarter,
      event_date: reportData.event_date || new Date().toISOString().split('T')[0],
      duration_minutes: reportData.duration_minutes || 60,
      faculty_count: reportData.faculty_count || 0,
      student_count: reportData.student_count || 0,
      funds_used: reportData.funds_used || 0,
      objective: reportData.objective || '',
      summary: reportData.summary || '',
      benefits: reportData.benefits || '',
      instagram_link: reportData.instagram_link || '',
      facebook_link: reportData.facebook_link || '',
      twitter_link: reportData.twitter_link || '',
      photo_1_url: reportData.photo_1_url || '',
      photo_2_url: reportData.photo_2_url || '',
      resource_persons: reportData.resource_persons || [],
      faculty_coordinators: reportData.faculty_coordinators || [],
      student_coordinators: reportData.student_coordinators || [],
      pdf_path: filePath,
      pdf_url: pdfUrl,
      status: 'generated',
      signatures: {},
    };

    // Upsert into second DB
    const { error: dbError } = await reportsClient
      .from('iic_event_reports')
      .upsert(reportRow, { onConflict: 'event_id' });

    if (dbError) {
      console.error('[DB Upsert Error]', dbError);
      // Fallback: delete old, re-insert
      await reportsClient.from('iic_event_reports').delete().eq('event_id', eventId);
      const { error: finalDbError } = await reportsClient.from('iic_event_reports').insert(reportRow);
      if (finalDbError) throw new Error('Database error: ' + finalDbError.message);
    }

    return NextResponse.json({ success: true, pdfUrl });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
