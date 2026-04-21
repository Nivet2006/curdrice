'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { CheckCircle2, XCircle, Loader2, Camera, ShieldCheck, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function PRScannerPage() {
    const supabase = createClient()
    const [scanResult, setScanResult] = useState<{
        success: boolean;
        message: string;
        details?: any;
    } | null>(null)
    const [processing, setProcessing] = useState(false)
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );
        
        scanner.render(onScanSuccess, onScanError);
        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
            }
        }
    }, [supabase]);

    const onScanSuccess = async (decodedText: string) => {
        if (processing) return;
        setProcessing(true);
        
        try {
            // Decoded text is the qr_token
            const { data: registration, error: fetchError } = await supabase
                .from('registrations')
                .select('*, profiles!student_id(full_name, usn), events(title)')
                .eq('qr_token', decodedText)
                .maybeSingle();

            if (fetchError || !registration) {
                setScanResult({ success: false, message: "Invalid QR Token or Record Not Found" });
                return;
            }

            if (registration.checked_in) {
                 setScanResult({ 
                    success: false, 
                    message: "Already Checked In", 
                    details: {
                        name: (registration.profiles as any)?.full_name,
                        event: (registration.events as any)?.title,
                        at: new Date(registration.checked_in_at).toLocaleTimeString()
                    }
                });
                return;
            }

            // Mark as checked in
            const { error: updateError } = await supabase
                .from('registrations')
                .update({ 
                    checked_in: true, 
                    checked_in_at: new Date().toISOString() 
                })
                .eq('id', registration.id);

            if (updateError) throw updateError;

            setScanResult({ 
                success: true, 
                message: "Attendance Marked Successfully",
                details: {
                    name: (registration.profiles as any)?.full_name,
                    usn: (registration.profiles as any)?.usn,
                    event: (registration.events as any)?.title
                }
            });
            toast.success(`Check-in successful: ${(registration.profiles as any)?.full_name}`);

        } catch (err: any) {
            console.error(err);
            setScanResult({ success: false, message: err.message || "An error occurred" });
        } finally {
            setProcessing(false);
            // Hide result after 8 seconds to allow next scan automatically (UX choice)
            // But we keep the UI responsive
        }
    }

    const onScanError = (err: any) => {
        // Suppress common noisy errors from scanner
    }

    return (
        <div className="max-w-[800px] mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a] uppercase italic">Attendance Terminal</h1>
                    <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-1">PR Entry Authorization / Real-time Audit</p>
                </div>
                <div className="bg-black text-white p-3 rounded-2xl shadow-xl">
                    <ShieldCheck size={20} />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Scanner Interface */}
                <div className="space-y-6">
                    <div className="relative aspect-square bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl skew-x-1 group">
                        <div id="reader" className="w-full h-full"></div>
                        {processing && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4 z-50">
                                <Loader2 className="animate-spin text-white" size={40} />
                                <span className="font-mono text-xs uppercase tracking-widest font-black">Validating Token...</span>
                            </div>
                        )}
                        {!processing && !scanResult && (
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="w-48 h-48 border-2 border-white/40 border-dashed rounded-3xl animate-pulse flex flex-col items-center justify-center bg-white/5 backdrop-blur-[2px]">
                                     <Camera className="text-white/20 mb-2" />
                                     <span className="text-[8px] text-white/40 font-mono tracking-widest uppercase">Target Area</span>
                                </div>
                             </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 italic font-mono text-[10px] text-zinc-400">
                        <Camera size={14} />
                        <span>Ensure the QR code is centered and well-lit. Terminal is auditing in real-time.</span>
                    </div>
                </div>

                {/* Result Display */}
                <div className="space-y-6">
                    <h3 className="font-mono text-[10px] font-black uppercase text-zinc-300 tracking-[0.3em]">Validation Stream</h3>
                    
                    {!scanResult ? (
                        <div className="h-64 border-2 border-dashed border-zinc-100 rounded-[2rem] flex flex-col items-center justify-center text-zinc-300 space-y-4 transition-all hover:bg-zinc-50 grayscale opacity-40">
                             <UserCheck size={48} />
                             <p className="font-mono text-[10px] uppercase font-bold">Awaiting Scan Input</p>
                        </div>
                    ) : (
                        <div className={`p-8 rounded-[2.5rem] border-2 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 ${scanResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-red-50 border-red-100 text-red-900'}`}>
                            <div className="flex items-center gap-4 mb-6">
                                {scanResult.success ? <CheckCircle2 className="text-emerald-500" size={32} /> : <XCircle className="text-red-500" size={32} />}
                                <div>
                                    <h4 className="font-black uppercase italic leading-tight text-xl">{scanResult.success ? 'Access Granted' : 'Access Denied'}</h4>
                                    <p className="text-[10px] font-mono uppercase tracking-widest opacity-60 font-bold">{scanResult.message}</p>
                                </div>
                            </div>

                            {scanResult.details && (
                                <div className="space-y-4 mt-6 pt-6 border-t border-black/5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-mono uppercase opacity-40">Participant</p>
                                            <p className="text-sm font-black uppercase">{scanResult.details.name}</p>
                                        </div>
                                        {scanResult.details.usn && (
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-mono uppercase opacity-40">Identity</p>
                                                <p className="text-sm font-black font-mono">{scanResult.details.usn}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-mono uppercase opacity-40">Secured Event</p>
                                        <p className="text-sm font-black uppercase tracking-tight">{scanResult.details.event}</p>
                                    </div>
                                    {scanResult.details.at && (
                                         <div className="space-y-1">
                                            <p className="text-[8px] font-mono uppercase opacity-40">Checked In At</p>
                                            <p className="text-sm font-black font-mono">{scanResult.details.at}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <button 
                                onClick={() => setScanResult(null)}
                                className="mt-8 w-full bg-black text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform active:scale-95"
                            >
                                Clear & Continue
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                #reader { border: none !important; }
                #reader__scan_region { background: transparent !important; }
                #reader__dashboard_section_csr button {
                    background: white !important;
                    color: black !important;
                    border-radius: 12px !important;
                    padding: 8px 16px !important;
                    font-size: 10px !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.1em !important;
                    border: none !important;
                    margin: 10px 0 !important;
                    cursor: pointer !important;
                }
                #reader__status_span { display: none !important; }
                #reader__camera_selection {
                    background: rgba(255,255,255,0.05) !important;
                    color: white !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 8px !important;
                    padding: 4px 8px !important;
                    font-size: 10px !important;
                    margin-bottom: 10px !important;
                }
            `}</style>
        </div>
    )
}
