import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';

export async function GET(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch report details
    const { data: report, error } = await supabase
      .from('iic_event_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Build the Word document programmatically using the docx package
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "INSTITUTION'S INNOVATION COUNCIL (IIC) REPORT",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: "Official Compliance Document",
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Activity Name", bold: true })] })] }),
                    new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph(report.activity_name || "N/A")] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Thrust Area", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(report.thrust_area || "N/A")] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Level of Activity", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(report.level || "N/A")] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Semester & Quarter", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(`${report.semester || "N/A"} (${report.quarter || "N/A"})`)] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date of Event", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(report.event_date || "N/A")] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Duration (mins)", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(String(report.duration_minutes || 0))] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Participants", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(`Students: ${report.student_count || 0}, Faculty: ${report.faculty_count || 0}`)] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Department", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(report.department || "N/A")] })
                  ]
                })
              ]
            }),
            new Paragraph({ text: "", spacing: { after: 200 } }),
            new Paragraph({
              text: "Objective",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph(report.objective || "No objective provided."),
            new Paragraph({
              text: "Executive Summary",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph(report.summary || "No summary provided."),
            new Paragraph({
              text: "Key Benefits / Learning Outcomes",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph(report.benefits || "No benefits provided."),
          ],
        },
      ],
    });

    const docBuffer = await Packer.toBuffer(doc);

    return new Response(docBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="IIC_Report_${reportId}.docx"`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
