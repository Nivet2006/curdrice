'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Download, FileText, Layout, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function IICGeneratorPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchEvents = async () => {
            const { data, error } = await supabase
                .from('events')
                .select('id, title, event_date')
                .order('event_date', { ascending: false });
            
            if (error) {
                toast.error('Failed to fetch events');
            } else {
                setEvents(data || []);
            }
            setFetching(false);
        };
        fetchEvents();
    }, []);

    const handleGenerate = async () => {
        if (!selectedEventId) {
            toast.error('Please select an event');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/reports/iic-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: selectedEventId })
            });

            if (!response.ok) throw new Error('Generation failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `IIC_Report_${selectedEventId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success('Report generated successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-[#1B2A6B] flex flex-col items-center justify-center p-6 font-serif">
            <div className="max-w-2xl w-full space-y-8 bg-zinc-50 p-10 rounded-2xl border border-zinc-200 shadow-xl">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="bg-[#1B2A6B] p-3 rounded-full">
                            <FileText className="text-white" size={32} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">IIC Event Report Generator</h1>
                    <p className="text-[#4A90D9] font-sans text-sm uppercase tracking-widest">Ministry of HRD Initiative — Official Portal</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider text-[#1B2A6B]/70 ml-1">Select Event</label>
                        {fetching ? (
                            <div className="h-12 bg-white animate-pulse rounded-lg border border-zinc-200" />
                        ) : (
                            <select 
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                className="w-full h-12 px-4 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent outline-none bg-white transition-all text-lg font-sans"
                            >
                                <option value="">— Select an Event —</option>
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>
                                        {event.title} ({new Date(event.event_date).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !selectedEventId}
                        className="w-full h-14 bg-[#1B2A6B] hover:bg-[#1B2A6B]/90 text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                <span>Generating PDF...</span>
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                <span>Generate Official Report</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="pt-6 border-t border-zinc-200 grid grid-cols-2 gap-4 text-[10px] uppercase tracking-tighter text-zinc-400 font-sans">
                    <div className="flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-green-500" />
                        Server-Side Charting
                    </div>
                    <div className="flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-green-500" />
                        Institutional Styling
                    </div>
                    <div className="flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-green-500" />
                        Automatic PDF Formatting
                    </div>
                    <div className="flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-green-500" />
                        Direct DB Integration
                    </div>
                </div>
            </div>

            <footer className="mt-8 text-[10px] text-zinc-400 uppercase tracking-widest text-center">
                Confidential – IIC Institutional Report System<br />
                © 2026 Gopalan College of Engineering and Management
            </footer>
        </div>
    );
}
