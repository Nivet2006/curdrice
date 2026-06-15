import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    const eventId = report.event_id;

    // Fetch attendees
    const { data: attendees } = await supabaseAdmin
      .from('registrations')
      .select('profiles(full_name, usn, department)')
      .eq('event_id', eventId)
      .eq('checked_in', true);

    // Build standard report fields table
    const tableRows = [
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
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Semester", bold: true })] })] }),
          new TableCell({ children: [new Paragraph(report.semester || "N/A")] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Quarter", bold: true })] })] }),
          new TableCell({ children: [new Paragraph(report.quarter || "N/A")] })
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
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Faculty Count", bold: true })] })] }),
          new TableCell({ children: [new Paragraph(String(report.faculty_count || 0))] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Student Count", bold: true })] })] }),
          new TableCell({ children: [new Paragraph(String(report.student_count || 0))] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Funds Utilized", bold: true })] })] }),
          new TableCell({ children: [new Paragraph(String(report.funds_used || 0))] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Department", bold: true })] })] }),
          new TableCell({ children: [new Paragraph(report.department || "N/A")] })
        ]
      })
    ];

    // Children block of the docx structure
    const docChildren: any[] = [
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
        rows: tableRows
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
    ];

    // Resource Persons Section
    if (report.resource_persons && report.resource_persons.length > 0) {
      docChildren.push(
        new Paragraph({
          text: "Resource Persons",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      const isInternal = report.level === 'Institute' || report.level === 'Department';

      if (isInternal) {
        const rpRows = [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "S.No", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "USN", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Dept", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mobile", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Email", bold: true })] })] })
            ]
          })
        ];

        report.resource_persons.forEach((rp: any, i: number) => {
          rpRows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(String(i + 1))] }),
                new TableCell({ children: [new Paragraph(rp.name || 'N/A')] }),
                new TableCell({ children: [new Paragraph(rp.usn || 'N/A')] }),
                new TableCell({ children: [new Paragraph(rp.department || 'N/A')] }),
                new TableCell({ children: [new Paragraph(rp.mobile || 'N/A')] }),
                new TableCell({ children: [new Paragraph(rp.email || 'N/A')] })
              ]
            })
          );
        });

        docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rpRows }));
      } else {
        const rpRows = [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "S.No", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Designation & Org", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mobile / Email", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Address", bold: true })] })] })
            ]
          })
        ];

        report.resource_persons.forEach((rp: any, i: number) => {
          rpRows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(String(i + 1))] }),
                new TableCell({ children: [new Paragraph(rp.name || 'N/A')] }),
                new TableCell({ children: [new Paragraph(`${rp.designation || 'N/A'} - ${rp.organization || 'N/A'}`)] }),
                new TableCell({ children: [new Paragraph(`${rp.mobile || 'N/A'} / ${rp.email || 'N/A'}`)] }),
                new TableCell({ children: [new Paragraph(rp.address || 'N/A')] })
              ]
            })
          );
        });

        docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rpRows }));
      }
    }

    // Social Media Links and Coordinators
    docChildren.push(
      new Paragraph({
        text: "Social Media Links & Coordinators",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Instagram", bold: true })] })] }),
              new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph(report.instagram_link || "N/A")] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Facebook", bold: true })] })] }),
              new TableCell({ children: [new Paragraph(report.facebook_link || "N/A")] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Twitter", bold: true })] })] }),
              new TableCell({ children: [new Paragraph(report.twitter_link || "N/A")] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Faculty Coordinators", bold: true })] })] }),
              new TableCell({ children: [new Paragraph((report.faculty_coordinators || []).join(', ') || "N/A")] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Student Coordinators", bold: true })] })] }),
              new TableCell({ children: [new Paragraph((report.student_coordinators || []).join(', ') || "N/A")] })
            ]
          })
        ]
      })
    );

    // Attendance sheet if present
    if (attendees && attendees.length > 0) {
      docChildren.push(
        new Paragraph({
          text: "Attendance Sheet (Present Participants)",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 250, after: 100 },
        })
      );

      const attRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "S.No", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "USN", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Dept", bold: true })] })] })
          ]
        })
      ];

      attendees.forEach((att: any, i: number) => {
        const profile = att.profiles;
        attRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(String(i + 1))] }),
              new TableCell({ children: [new Paragraph(profile?.full_name || 'N/A')] }),
              new TableCell({ children: [new Paragraph(profile?.usn || 'N/A')] }),
              new TableCell({ children: [new Paragraph(profile?.department || 'N/A')] })
            ]
          })
        );
      });

      docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: attRows }));
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    const docBuffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(docBuffer);

    return new Response(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="IIC_Report_${reportId}.docx"`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
