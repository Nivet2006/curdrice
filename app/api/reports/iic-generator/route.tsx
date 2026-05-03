import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import ReactPDF from '@react-pdf/renderer';
import { IICReportDocument } from '@/components/reports/IICReportDocument';
import { generateChartBuffer } from '@/lib/charts-server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function POST(request: Request) {
    try {
        const { eventId } = await request.json();
        if (!eventId) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Fetch Event Data
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (eventError || !event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        // 2. Fetch All Related Data (Coordinators, Photos, Flyers, etc.)
        const [
            { data: facultyCoordinators },
            { data: studentCoordinators },
            { data: resourcePersons },
            { data: feedbackResponses },
            { data: flyers },
            { data: photos },
            { data: socialMedia },
            { data: registrations },
            { data: attendance }
        ] = await Promise.all([
            supabase.from('faculty_coordinators').select('*').eq('event_id', eventId),
            supabase.from('student_coordinators').select('*').eq('event_id', eventId),
            supabase.from('resource_persons').select('*').eq('event_id', eventId),
            supabase.from('feedback_responses').select('*').eq('event_id', eventId),
            supabase.from('flyers').select('*').eq('event_id', eventId),
            supabase.from('photos').select('*').eq('event_id', eventId),
            supabase.from('social_media').select('*').eq('event_id', eventId),
            supabase.from('registrations').select(`
                *,
                profiles (full_name, usn, department, email)
            `).eq('event_id', eventId),
            supabase.from('registrations').select(`
                *,
                profiles (full_name, usn, department, semester, year, email)
            `)
            .eq('event_id', eventId)
            .eq('checked_in', true)
            // Filter by feedback submitted (assuming field exists in registrations or separate table)
            // If it's in a separate table, we'd need a more complex join or separate fetch
        ]);

        // Flatten data for the PDF component
        const formattedRegistrations = registrations?.map((r: any) => ({
            ...r,
            full_name: r.profiles?.full_name,
            usn: r.profiles?.usn,
            department: r.profiles?.department,
            email: r.profiles?.email
        })) || [];

        const formattedAttendance = attendance?.map((a: any) => ({
            ...a,
            full_name: a.profiles?.full_name,
            usn: a.profiles?.usn,
            department: a.profiles?.department,
            semester: a.profiles?.semester,
            year: a.profiles?.year,
            email: a.profiles?.email
        })) || [];

        // 3. Generate Charts
        const feedbackCharts = [];
        if (feedbackResponses) {
            for (const fr of feedbackResponses) {
                const chartBuffer = await generateChartBuffer(
                    fr.response_type as 'bar' | 'pie',
                    fr.question,
                    fr.responses || []
                );
                feedbackCharts.push({
                    question: fr.question,
                    buffer: `data:image/png;base64,${chartBuffer.toString('base64')}`,
                    count: fr.responses?.length || 0
                });
            }
        }

        // 4. Load Logos
        const getLogoBase64 = (name: string) => {
            const path = join(process.cwd(), 'public', 'iic', name);
            if (existsSync(path)) {
                return `data:image/png;base64,${readFileSync(path).toString('base64')}`;
            }
            return null;
        };

        const data = {
            event,
            facultyCoordinators,
            studentCoordinators,
            resourcePersons,
            feedbackCharts,
            registrations: formattedRegistrations,
            attendance: formattedAttendance,
            flyers: flyers?.map(f => f.url) || [],
            photos: photos || [],
            socialMedia: socialMedia || [],
            gcemLogo: getLogoBase64('gcem-crest.png'),
            iicLogo: getLogoBase64('iic-logo.png'),
            collegeName: 'Gopalan College of Engineering and Management'
        };

        // 5. Render PDF
        const stream = await ReactPDF.renderToStream(<IICReportDocument data={data} />);
        
        // Convert stream to buffer
        const chunks: any[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="IIC_Report_${eventId}.pdf"`
            }
        });

    } catch (error: any) {
        console.error('Report Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
