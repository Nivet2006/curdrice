import { CertProject, CertRow } from './types';
import { generateSingleCertificate } from './certGenerator';
import JSZip from 'jszip';

export interface PipelineProgress {
  status: 'idle' | 'generating' | 'packaging' | 'sending' | 'completed' | 'failed';
  processedCount: number;
  totalCount: number;
  currentEmail?: string;
  stageProgress: number; // 0-100
}

export interface PipelineOptions {
  project: CertProject;
  sendEmail: boolean;
  downloadZip: boolean;
  onProgress?: (progress: PipelineProgress) => void;
}

/**
 * Runs the end-to-end certificate generation, packaging, and email delivery pipeline.
 */
export async function runCertificatePipeline({
  project,
  sendEmail,
  downloadZip,
  onProgress
}: PipelineOptions): Promise<{ success: boolean; error?: string; results?: any }> {
  const totalCount = project.rows.length;
  if (totalCount === 0) {
    return { success: false, error: 'No data rows found to process.' };
  }

  if (!project.templatePdfBytes) {
    return { success: false, error: 'Template PDF is missing.' };
  }

  const updateProgress = (
    status: PipelineProgress['status'],
    processedCount: number,
    stageProgress: number,
    currentEmail?: string
  ) => {
    if (onProgress) {
      onProgress({ status, processedCount, totalCount, stageProgress, currentEmail });
    }
  };

  try {
    const generatedPdfs: { name: string; blob: Blob; base64: string; email: string; recipientName: string }[] = [];
    const zip = new JSZip();

    // Stage 1: Generate PDF documents
    updateProgress('generating', 0, 0);
    
    // Find mapped name and email columns
    const nameField = project.fields.find(f => f.label.toLowerCase().includes('name') || f.dataColumn?.toLowerCase().includes('name'));
    const emailField = project.fields.find(f => f.label.toLowerCase().includes('email') || f.dataColumn?.toLowerCase().includes('email'));
    
    const nameCol = nameField?.dataColumn || 'Name';
    const emailCol = emailField?.dataColumn || 'Email';

    for (let i = 0; i < totalCount; i++) {
      const row = project.rows[i];
      updateProgress('generating', i, Math.round((i / totalCount) * 100));

      const pdfBlob = await generateSingleCertificate({
        pdfBytes: project.templatePdfBytes,
        fields: project.fields,
        rowData: row.data,
        globalFont: project.globalFont,
        globalColor: project.globalColor,
        globalFontScale: project.globalFontScale,
        dateFormat: project.dateFormat
      });

      // Convert PDF blob to base64 for email sending
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let j = 0; j < bytes.byteLength; j++) {
        binary += String.fromCharCode(bytes[j]);
      }
      const base64 = btoa(binary);

      const recipientName = row.data[nameCol] || row.data['Name'] || `Recipient_${i + 1}`;
      const email = row.data[emailCol] || row.data['Email'] || '';
      
      const fileName = `${recipientName.replace(/\s+/g, '_')}_Certificate.pdf`;

      generatedPdfs.push({
        name: fileName,
        blob: pdfBlob,
        base64,
        email,
        recipientName
      });

      if (downloadZip) {
        zip.file(fileName, pdfBlob);
      }
    }

    updateProgress('generating', totalCount, 100);

    // Stage 2: Zip & Download
    if (downloadZip) {
      updateProgress('packaging', totalCount, 20);
      const zipContent = await zip.generateAsync({ type: 'blob' });
      updateProgress('packaging', totalCount, 80);

      // Trigger browser download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipContent);
      link.download = `${project.fileNamePattern.replace('{Name}', 'Batch') || 'Certificates'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      updateProgress('packaging', totalCount, 100);
    }

    // Stage 3: Email dispatch
    let emailResults: any[] = [];
    if (sendEmail) {
      updateProgress('sending', 0, 0);

      const eventName = project.rows[0]?.data['Event'] || 'EventHub';
      const eventDate = project.rows[0]?.data['EventDate'] || '';

      // Chunk requests to avoid hitting HTTP post body payload size limit
      const chunkSize = 3;
      for (let i = 0; i < generatedPdfs.length; i += chunkSize) {
        const chunk = generatedPdfs.slice(i, i + chunkSize);
        
        updateProgress('sending', i, Math.round((i / generatedPdfs.length) * 100), chunk[0]?.email);

        const payload = {
          eventId: project.rows[0]?.id || 'batch_run',
          eventName,
          dateStr: eventDate,
          recipients: chunk.map(item => ({
            email: item.email,
            name: item.recipientName,
            pdfBase64: item.base64
          }))
        };

        const response = await fetch('/api/cert/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();
        if (response.ok && resData.results) {
          emailResults = [...emailResults, ...resData.results];
        } else {
          console.error('[PIPELINE EMAIL CHUNK FAILED]', resData.error);
          chunk.forEach(item => {
            emailResults.push({
              email: item.email,
              status: 'failed',
              error: resData.error || 'Server error'
            });
          });
        }
      }
      updateProgress('sending', totalCount, 100);
    }

    updateProgress('completed', totalCount, 100);
    return {
      success: true,
      results: {
        emails: emailResults,
        count: totalCount
      }
    };
  } catch (err: any) {
    console.error('[CERT PIPELINE ERROR]', err);
    updateProgress('failed', 0, 0);
    return {
      success: false,
      error: err.message || 'Pipeline execution failed.'
    };
  }
}
