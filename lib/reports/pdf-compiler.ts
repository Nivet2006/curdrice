import { b2Client, B2_BUCKET_NAME, b2ImagesClient, B2_IMAGES_BUCKET_NAME } from '@/lib/b2';
import { PutObjectCommand, DeleteObjectCommand, ListObjectVersionsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Load logos from public/iic/ at startup (server-side only)
function loadLogoBytes(filename: string): Buffer | null {
  const filePath = join(process.cwd(), 'public', 'iic', filename);
  if (existsSync(filePath)) {
    return readFileSync(filePath);
  }
  // Fallback check for different environments
  const fallbackPath = join(process.cwd(), '..', 'public', 'iic', filename);
  if (existsSync(fallbackPath)) {
    return readFileSync(fallbackPath);
  }
  console.warn(`[PDF] Logo not found: ${filename} — skipping.`);
  return null;
}

// Helper to strip non-WinAnsi characters (emojis, etc.) that crash standard PDF fonts
function sanitizeText(text: string): string {
  if (!text) return '';
  return text.replace(/[^\x00-\x7F\x80-\xFF]/g, '');
}

// Simple Markdown to Plain Text formatter for PDF
function cleanMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#+\s+(.*)$/gm, '$1') // Remove heading hashes
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1')     // Remove italics
    .replace(/^>\s+(.*)$/gm, '    $1') // Indent blockquotes
    .replace(/^- (.*)$/gm, '• $1')    // Bullet points
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '') // Remove code blocks
    .replace(/\|/g, ' ')               // Remove table pipes
    .replace(/-{3,}/g, ' ')            // Remove horizontal rules
    .trim();
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    let imageBytes: Uint8Array;
    if (url.includes('/api/assets/')) {
      const urlParts = url.split('/api/assets/');
      const key = urlParts[urlParts.length - 1];
      const response = await b2ImagesClient.send(
        new GetObjectCommand({
          Bucket: B2_IMAGES_BUCKET_NAME,
          Key: key,
        })
      );
      if (!response.Body) return null;
      imageBytes = await response.Body.transformToByteArray();
    } else {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buffer = await res.arrayBuffer();
      imageBytes = new Uint8Array(buffer);
    }
    return imageBytes;
  } catch (e) {
    console.error("Failed to fetch image bytes for signature", url, e);
    return null;
  }
}

export async function compileIICReportPDF(reportId: string): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  try {
    // 1. Fetch Report Row
    const { data: report, error: reportErr } = await supabaseAdmin
      .from('iic_event_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportErr || !report) {
      return { success: false, error: `Report not found: ${reportErr?.message || ''}` };
    }

    const eventId = report.event_id;

    // 2. Fetch signatures if approved by faculty / HOD
    let facultySignatureUrl = '';
    if (report.approved_by_faculty) {
      const { data: facProfile } = await supabaseAdmin
        .from('profiles')
        .select('signature_url')
        .eq('id', report.approved_by_faculty)
        .single();
      if (facProfile?.signature_url) {
        facultySignatureUrl = facProfile.signature_url;
      }
    }

    let hodSignatureUrl = '';
    if (report.approved_by_hod) {
      const { data: hodProfile } = await supabaseAdmin
        .from('profiles')
        .select('signature_url')
        .eq('id', report.approved_by_hod)
        .single();
      if (hodProfile?.signature_url) {
        hodSignatureUrl = hodProfile.signature_url;
      }
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
    
    let gcemImage = null;
    let iicImage = null;

    if (gcemBytes) {
      try {
        gcemImage = await pdfDoc.embedPng(gcemBytes);
      } catch (e) {
        console.error("[PDF] Failed to embed GCEM PNG, trying JPG", e);
        try { gcemImage = await pdfDoc.embedJpg(gcemBytes); } catch (e2) { console.error("[PDF] Failed both", e2); }
      }
    }
    
    if (iicBytes) {
      try {
        iicImage = await pdfDoc.embedPng(iicBytes);
      } catch (e) {
        console.error("[PDF] Failed to embed IIC PNG, trying JPG", e);
        try { iicImage = await pdfDoc.embedJpg(iicBytes); } catch (e2) { console.error("[PDF] Failed both", e2); }
      }
    }

    const addLetterheadPage = () => {
       const page = pdfDoc.addPage([595.28, 841.89]); // A4
       const { width, height } = page.getSize();

       // ── WHITE BACKGROUND (fill entire page) ──
       page.drawRectangle({
          x: 0, y: 0, width, height,
          color: rgb(1, 1, 1),  // solid white
       });
       
       // Premium double border with subtle color
       page.drawRectangle({
          x: 10, y: 10, width: width - 20, height: height - 20,
          borderWidth: 1.5, borderColor: rgb(0.1, 0.1, 0.2),
       });
       page.drawRectangle({
          x: 14, y: 14, width: width - 28, height: height - 28,
          borderWidth: 0.5, borderColor: rgb(0.1, 0.1, 0.2),
       });

       // GCEM Logo (left)
       if (gcemImage) {
         const dims = gcemImage.scaleToFit(250, 80); 
         page.drawImage(gcemImage, { 
           x: 30, 
           y: height - dims.height - 35, 
           width: dims.width, 
           height: dims.height 
         });
       }
       
       // IIC Logo (right)
       if (iicImage) {
         const dims = iicImage.scaleToFit(200, 80);
         page.drawImage(iicImage, { 
           x: width - dims.width - 30, 
           y: height - dims.height - 35, 
           width: dims.width, 
           height: dims.height 
         });
       }

       return page;
    };

    // Page 1
    let page = addLetterheadPage();
    let currentY = 700;

    const drawRow = (label: string, value: string) => {
       const text = value ? sanitizeText(value.toString()) : 'N/A';
       const maxWidth = 350;
       const fontSize = 11;
       
       const paragraphs = text.split(/\r?\n/);
       const lines: string[] = [];
       
       paragraphs.forEach(p => {
         if (p.trim() === '') {
           lines.push(' ');
           return;
         }
         const words = p.split(' ');
         let currentLine = '';
         for (let n = 0; n < words.length; n++) {
           const testLine = currentLine + words[n] + ' ';
           const testWidth = font.widthOfTextAtSize(testLine, fontSize);
           if (testWidth > maxWidth && n > 0) {
             lines.push(currentLine);
             currentLine = words[n] + ' ';
           } else {
             currentLine = testLine;
           }
         }
         lines.push(currentLine);
       });

       const rowHeight = Math.max(30, lines.length * 15);
       if (currentY < rowHeight + 50) {
          page = addLetterheadPage();
          currentY = 700;
       }

       page.drawText(label, { x: 40, y: currentY, font: fontBold, size: 11 });
       
       lines.forEach((l, idx) => {
         page.drawText(l.trim(), { x: 200, y: currentY - (idx * 15), font: font, size: 11 });
       });
       
       currentY -= rowHeight;
    };

    drawRow("1. Activity Name", report.activity_name);
    drawRow("2. Thrust Area", report.thrust_area);
    drawRow("3. Level of Activity", report.level);
    drawRow("4. Semester", report.semester);
    drawRow("5. Quarter", report.quarter);
    drawRow("6. Date of Event", report.event_date);
    drawRow("7. Duration (mins)", String(report.duration_minutes));
    drawRow("8. Faculty Count", String(report.faculty_count));
    drawRow("9. Student Count", String(report.student_count));
    drawRow("10. Funds Utilized", String(report.funds_used));
    drawRow("11. Department", report.department);
    drawRow("12. Objective", cleanMarkdown(report.objective));
    drawRow("13. Summary", cleanMarkdown(report.summary));
    drawRow("14. Benefits", cleanMarkdown(report.benefits));

    // Resource Persons
    page = addLetterheadPage();
    currentY = 700;
    page.drawText("15. Resource Persons:", { x: 40, y: currentY, font: fontBold, size: 12 });
    currentY -= 30;

    if (report.resource_persons && report.resource_persons.length > 0) {
      const isInternal = report.level === 'Institute' || report.level === 'Department';

      if (isInternal) {
        // Draw Table Header for Internal Resource Persons
        page.drawText("S.No", { x: 40, y: currentY, font: fontBold, size: 9 });
        page.drawText("Name", { x: 70, y: currentY, font: fontBold, size: 9 });
        page.drawText("USN", { x: 170, y: currentY, font: fontBold, size: 9 });
        page.drawText("Dept", { x: 260, y: currentY, font: fontBold, size: 9 });
        page.drawText("Mobile", { x: 310, y: currentY, font: fontBold, size: 9 });
        page.drawText("Email", { x: 410, y: currentY, font: fontBold, size: 9 });
        currentY -= 15;
        page.drawLine({ start: { x: 40, y: currentY + 8 }, end: { x: 550, y: currentY + 8 }, thickness: 0.5 });

        report.resource_persons.forEach((rp: any, idx: number) => {
          if (currentY < 100) {
            page = addLetterheadPage();
            currentY = 700;
            // Draw headers on new page
            page.drawText("S.No", { x: 40, y: currentY, font: fontBold, size: 9 });
            page.drawText("Name", { x: 70, y: currentY, font: fontBold, size: 9 });
            page.drawText("USN", { x: 170, y: currentY, font: fontBold, size: 9 });
            page.drawText("Dept", { x: 260, y: currentY, font: fontBold, size: 9 });
            page.drawText("Mobile", { x: 310, y: currentY, font: fontBold, size: 9 });
            page.drawText("Email", { x: 410, y: currentY, font: fontBold, size: 9 });
            currentY -= 15;
            page.drawLine({ start: { x: 40, y: currentY + 8 }, end: { x: 550, y: currentY + 8 }, thickness: 0.5 });
          }

          page.drawText(sanitizeText(String(idx + 1)), { x: 40, y: currentY, font: font, size: 8 });
          page.drawText(sanitizeText(rp.name || 'N/A'), { x: 70, y: currentY, font: font, size: 8 });
          page.drawText(sanitizeText(rp.usn || 'N/A'), { x: 170, y: currentY, font: font, size: 8 });
          page.drawText(sanitizeText(rp.department || 'N/A'), { x: 260, y: currentY, font: font, size: 8 });
          page.drawText(sanitizeText(rp.mobile || 'N/A'), { x: 310, y: currentY, font: font, size: 8 });
          page.drawText(sanitizeText(rp.email || 'N/A'), { x: 410, y: currentY, font: font, size: 8 });
          
          currentY -= 15;
          page.drawLine({ start: { x: 40, y: currentY + 8 }, end: { x: 550, y: currentY + 8 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
        });
      } else {
        // Draw Table Header for External Speakers
        page.drawText("S.No", { x: 40, y: currentY, font: fontBold, size: 9 });
        page.drawText("Name", { x: 70, y: currentY, font: fontBold, size: 9 });
        page.drawText("Designation & Org", { x: 160, y: currentY, font: fontBold, size: 9 });
        page.drawText("Mobile / Email", { x: 320, y: currentY, font: fontBold, size: 9 });
        page.drawText("Address", { x: 440, y: currentY, font: fontBold, size: 9 });
        currentY -= 15;
        page.drawLine({ start: { x: 40, y: currentY + 8 }, end: { x: 550, y: currentY + 8 }, thickness: 0.5 });

        report.resource_persons.forEach((rp: any, idx: number) => {
          if (currentY < 120) {
            page = addLetterheadPage();
            currentY = 700;
            // Draw headers on new page
            page.drawText("S.No", { x: 40, y: currentY, font: fontBold, size: 9 });
            page.drawText("Name", { x: 70, y: currentY, font: fontBold, size: 9 });
            page.drawText("Designation & Org", { x: 160, y: currentY, font: fontBold, size: 9 });
            page.drawText("Mobile / Email", { x: 320, y: currentY, font: fontBold, size: 9 });
            page.drawText("Address", { x: 440, y: currentY, font: fontBold, size: 9 });
            currentY -= 15;
            page.drawLine({ start: { x: 40, y: currentY + 8 }, end: { x: 550, y: currentY + 8 }, thickness: 0.5 });
          }

          page.drawText(sanitizeText(String(idx + 1)), { x: 40, y: currentY, font: font, size: 8 });
          page.drawText(sanitizeText(rp.name || 'N/A'), { x: 70, y: currentY, font: font, size: 8 });
          
          const desigText = `${rp.designation || 'N/A'} - ${rp.organization || 'N/A'}`;
          page.drawText(sanitizeText(desigText), { x: 160, y: currentY, font: font, size: 8 });
          
          const contactText = `${rp.mobile || 'N/A'} / ${rp.email || 'N/A'}`;
          page.drawText(sanitizeText(contactText), { x: 320, y: currentY, font: font, size: 8 });
          
          page.drawText(sanitizeText(rp.address || 'N/A'), { x: 440, y: currentY, font: font, size: 8 });

          currentY -= 20;
          page.drawLine({ start: { x: 40, y: currentY + 12 }, end: { x: 550, y: currentY + 12 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
        });
      }
      currentY -= 20;
    }

    // Social Links & Coordinators
    if (currentY < 150) { page = addLetterheadPage(); currentY = 700; }
    drawRow("19. Instagram", report.instagram_link);
    drawRow("19. Facebook", report.facebook_link);
    drawRow("19. Twitter", report.twitter_link);
    drawRow("21. Faculty Coordinators", (report.faculty_coordinators || []).join(', '));
    drawRow("22. Student Coordinators", (report.student_coordinators || []).join(', '));

    // --- NEW: ATTENDANCE SHEET ---
    const { data: attendees } = await supabaseAdmin
      .from('registrations')
      .select('profiles(full_name, usn, department)')
      .eq('event_id', eventId)
      .eq('checked_in', true);

    if (attendees && attendees.length > 0) {
      page = addLetterheadPage();
      currentY = 700;
      page.drawText("Attendance Sheet (Present Participants)", { x: 40, y: currentY, font: fontBold, size: 14 });
      currentY -= 30;
      
      // Header
      page.drawText("S.No", { x: 40, y: currentY, font: fontBold, size: 10 });
      page.drawText("Name", { x: 80, y: currentY, font: fontBold, size: 10 });
      page.drawText("USN", { x: 250, y: currentY, font: fontBold, size: 10 });
      page.drawText("Dept", { x: 400, y: currentY, font: fontBold, size: 10 });
      currentY -= 20;
      page.drawLine({ start: { x: 40, y: currentY + 15 }, end: { x: 550, y: currentY + 15 }, thickness: 0.5 });

      attendees.forEach((att: any, i: number) => {
        if (currentY < 50) {
          page = addLetterheadPage();
          currentY = 750;
        }
        const profile = att.profiles;
        page.drawText(sanitizeText(String(i+1)), { x: 45, y: currentY, font: font, size: 9 });
        page.drawText(sanitizeText(profile?.full_name || 'N/A'), { x: 80, y: currentY, font: font, size: 9 });
        page.drawText(sanitizeText(profile?.usn || 'N/A'), { x: 250, y: currentY, font: font, size: 9 });
        page.drawText(sanitizeText(profile?.department || 'N/A'), { x: 400, y: currentY, font: font, size: 9 });
        currentY -= 15;
      });
    }

    // --- NEW: FEEDBACK GRAPHS ---
    const { data: feedbacks } = await supabaseAdmin.from('feedback_responses').select('*').eq('event_id', eventId);
    if (feedbacks && feedbacks.length > 0) {
      const { generateChartBuffer } = await import('@/lib/charts-server');
      page = addLetterheadPage();
      currentY = 700;
      page.drawText("Feedback Analysis", { x: 40, y: currentY, font: fontBold, size: 14 });
      currentY -= 40;

      for (const fb of feedbacks) {
        if (currentY < 300) { page = addLetterheadPage(); currentY = 700; }
        const chartBuffer = await generateChartBuffer(fb.response_type as 'bar' | 'pie', fb.question, fb.responses || []);
        const chartImg = await pdfDoc.embedPng(chartBuffer);
        const dims = chartImg.scaleToFit(500, 200);
        page.drawImage(chartImg, { x: (595.28 - dims.width) / 2, y: currentY - dims.height, width: dims.width, height: dims.height });
        currentY -= (dims.height + 40);
      }
    }

    // Page 3 - Photo Collages
    if (report.photo_1_url || report.photo_2_url) {
       page = addLetterheadPage();
       page.drawText("Photo Collages", { x: 40, y: 700, font: fontBold, size: 14 });
       
       const drawRemoteImage = async (url: string, yPos: number) => {
         try {
           const bytes = await fetchImageBytes(url);
           if (!bytes) return;
           
           let img;
           try {
             img = await pdfDoc.embedJpg(bytes);
           } catch {
             img = await pdfDoc.embedPng(bytes);
           }
           
           if (img) {
             const dims = img.scaleToFit(500, 250);
             page.drawImage(img, {
               x: (595.28 - dims.width) / 2,
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

       if (report.photo_1_url) await drawRemoteImage(report.photo_1_url, 650);
       if (report.photo_2_url) await drawRemoteImage(report.photo_2_url, 350);
    }

    // --- SIGNATURES (AT THE END) ---
    page = addLetterheadPage();
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

    // Draw Faculty Coordinator Signature if available
    if (report.approved_by_faculty) {
      let bytes = null;
      if (facultySignatureUrl) {
        bytes = await fetchImageBytes(facultySignatureUrl);
      }
      if (!bytes) {
        bytes = loadLogoBytes('signature-faculty-coordinator.png');
      }
      if (bytes) {
        try {
          let sigImg;
          try {
            sigImg = await pdfDoc.embedPng(bytes);
          } catch {
            sigImg = await pdfDoc.embedJpg(bytes);
          }
          if (sigImg) {
            const dims = sigImg.scaleToFit(110, 45);
            const x = 115 - (dims.width / 2);
            page.drawImage(sigImg, { x, y: currentY + 2, width: dims.width, height: dims.height });
          }
        } catch (err) {
          console.error("Failed to embed Faculty Coordinator signature", err);
        }
      }
    }

    // Draw HOD Signature if available
    if (report.approved_by_hod) {
      let bytes = null;
      if (hodSignatureUrl) {
        bytes = await fetchImageBytes(hodSignatureUrl);
      }
      if (!bytes) {
        bytes = loadLogoBytes('signature-hod.png');
      }
      if (bytes) {
        try {
          let sigImg;
          try {
            sigImg = await pdfDoc.embedPng(bytes);
          } catch {
            sigImg = await pdfDoc.embedJpg(bytes);
          }
          if (sigImg) {
            const dims = sigImg.scaleToFit(110, 45);
            const x = 295 - (dims.width / 2);
            page.drawImage(sigImg, { x, y: currentY + 2, width: dims.width, height: dims.height });
          }
        } catch (err) {
          console.error("Failed to embed HOD signature", err);
        }
      }
    }

    // Draw IIC President Signature if approved by HOD
    if (report.approved_by_hod) {
      const bytes = loadLogoBytes('signature-iic-president.png');
      if (bytes) {
        try {
          let sigImg;
          try {
            sigImg = await pdfDoc.embedPng(bytes);
          } catch {
            sigImg = await pdfDoc.embedJpg(bytes);
          }
          if (sigImg) {
            const dims = sigImg.scaleToFit(110, 45);
            const x = 475 - (dims.width / 2);
            page.drawImage(sigImg, { x, y: currentY + 2, width: dims.width, height: dims.height });
          }
        } catch (err) {
          console.error("Failed to embed IIC President signature", err);
        }
      }
    }

    const pdfBytes = await pdfDoc.save();

    // -------------------------------------------------------------
    // UPLOAD TO BACKBLAZE B2 OBJECT STORAGE
    // -------------------------------------------------------------
    try {
      const listVersionsCommand = new ListObjectVersionsCommand({
        Bucket: B2_BUCKET_NAME,
        Prefix: `${eventId}/`,
      });
      const versionsResult = await b2Client.send(listVersionsCommand);

      const deleteObjects = [];

      if (versionsResult.Versions && versionsResult.Versions.length > 0) {
        for (const version of versionsResult.Versions) {
          if (version.Key) {
            deleteObjects.push({
              Key: version.Key,
              VersionId: version.VersionId,
            });
          }
        }
      }

      if (versionsResult.DeleteMarkers && versionsResult.DeleteMarkers.length > 0) {
        for (const marker of versionsResult.DeleteMarkers) {
          if (marker.Key) {
            deleteObjects.push({
              Key: marker.Key,
              VersionId: marker.VersionId,
            });
          }
        }
      }

      if (deleteObjects.length > 0) {
        console.log(`[B2 Purge] Permanently deleting ${deleteObjects.length} file version(s)/marker(s) in folder: ${eventId}/`);
        for (const obj of deleteObjects) {
          await b2Client.send(
            new DeleteObjectCommand({
              Bucket: B2_BUCKET_NAME,
              Key: obj.Key,
              VersionId: obj.VersionId,
            })
          );
        }
      }
    } catch (cleanupErr) {
      console.warn('[B2 Cleanup Warning] Failed to permanently delete prior report versions:', cleanupErr);
    }

    const timestamp = new Date().getTime();
    const filePath = `${eventId}/${timestamp}_report.pdf`;

    await b2Client.send(
      new PutObjectCommand({
        Bucket: B2_BUCKET_NAME,
        Key: filePath,
        Body: pdfBytes,
        ContentType: 'application/pdf',
      })
    );

    const b2Endpoint = process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com';
    let pdfUrl = '';
    if (process.env.B2_DOWNLOAD_URL) {
      pdfUrl = `${process.env.B2_DOWNLOAD_URL}/${filePath}`;
    } else {
      const match = b2Endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/);
      const region = match ? match[1] : 'us-west-004';
      const b2Domain = region.startsWith('us-west-') ? `f${region.replace('us-west-', '')}.backblazeb2.com` : `f004.backblazeb2.com`;
      pdfUrl = `https://${b2Domain}/file/${B2_BUCKET_NAME}/${filePath}`;
    }

    // Update database row
    const { error: updateErr } = await supabaseAdmin
      .from('iic_event_reports')
      .update({
        pdf_path: filePath,
        pdf_url: pdfUrl,
      })
      .eq('id', reportId);

    if (updateErr) {
      console.error('[DB Update Error]', updateErr);
      return { success: false, error: `Database error updating PDF url: ${updateErr.message}` };
    }

    return { success: true, pdfUrl };

  } catch (error: any) {
    console.error('[PDF Compiler Error]', error);
    return { success: false, error: error.message };
  }
}
