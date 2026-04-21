'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { lookupQRToken, confirmCheckIn } from '@/lib/actions/manager'
import { 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    Camera, 
    ShieldCheck, 
    User, 
    Calendar, 
    MapPin, 
    Hash,
    UserCheck,
    RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

type LookupResult = {
  registrationId: string
  alreadyCheckedIn: boolean
  checkedInAt: string | null
  student: {
    name: string
    usn: string
    department: string
    semester: number | string
    year: number | string
  }
  event: {
    title: string
    date: string | null
    location: string
  }
}

export default function PRScannerPage() {
    const [lookupData, setLookupData] = useState<LookupResult | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [error, setError] = useState<string | null>(null)
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
                scannerRef.current.clear().catch(err => console.error("Scanner cleanup failed", err));
            }
        }
    }, []);

    const onScanSuccess = async (decodedText: string) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setError(null);
        setLookupData(null);
        
        // Pause scanner during processing
        try {
            scannerRef.current?.pause(true);
        } catch(e) {}

        let token = decodedText;
        const tokenMatch = decodedText.match(/token=([a-zA-Z0-9-]+)/);
        if (tokenMatch) token = tokenMatch[1];

        try {
            const res = await lookupQRToken(token);
            if (res.error) {
                setError(res.error);
                // Resume after delay
                setTimeout(() => {
                    setError(null);
                    setIsProcessing(false);
                    try { scannerRef.current?.resume(); } catch(e) {}
                }, 3000);
            } else {
                setLookupData(res as LookupResult);
            }
        } catch (err: any) {
            setError(err.message || "Network Error");
            setTimeout(() => {
                setError(null);
                setIsProcessing(false);
                try { scannerRef.current?.resume(); } catch(e) {}
            }, 3000);
        } finally {
            setIsProcessing(false);
        }
    }

    const onScanError = (err: any) => {
        // Noisy errors suppressed
    }

    const handleConfirm = async () => {
        if (!lookupData) return;
        setIsConfirming(true);

        try {
            const res = await confirmCheckIn(lookupData.registrationId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`Entry Authorized: ${lookupData.student.name}`);
                setLookupData(null);
                setIsProcessing(false);
                try { scannerRef.current?.resume(); } catch(e) {}
            }
        } catch (err: any) {
            toast.error("Process Failed");
        } finally {
            setIsConfirming(false);
        }
    }

    const handleRescan = () => {
        setLookupData(null);
        setError(null);
        setIsProcessing(false);
        try { scannerRef.current?.resume(); } catch(e) {}
    }

    return (
        <div className="max-w-[1000px] mx-auto space-y-10">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tightest text-[#0a0a0a] uppercase italic leading-none">PR Intelligence Terminal</h1>
                    <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-[0.3em] mt-2">Biometric / Ticket Authorization Secure Protocol</p>
                </div>
                <div className="bg-[#0a0a0a] text-white p-4 rounded-3xl shadow-2xl skew-y-1">
                    <ShieldCheck size={24} />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                {/* Scanner Interface (Left - 2 cols) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="relative aspect-square bg-[#0a0a0a] rounded-[3rem] overflow-hidden border-[12px] border-white shadow-2xl group">
                        <div id="reader" className="w-full h-full"></div>
                        
                        {(isProcessing || isConfirming) && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-4 z-50">
                                <Loader2 className="animate-spin text-zinc-400" size={48} />
                                <span className="font-mono text-[10px] uppercase tracking-[0.4em] font-black animate-pulse">Running Security Check...</span>
                            </div>
                        )}

                        {!isProcessing && !lookupData && !error && (
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="w-56 h-56 border-2 border-white/20 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center bg-white/5 backdrop-blur-[1px] animate-pulse">
                                     <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3">
                                        <Camera className="text-white/40" size={20} />
                                     </div>
                                     <span className="text-[8px] text-white/30 font-mono tracking-[0.2em] uppercase font-black">Scan Area Active</span>
                                </div>
                             </div>
                        )}
                    </div>

                    <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-3xl space-y-4 shadow-inner">
                        <div className="flex items-center gap-3 text-zinc-400 font-mono text-[9px] uppercase tracking-widest border-b border-zinc-100 pb-4">
                            <RefreshCw size={14} className="animate-spin-slow" />
                            <span>System Status: Operational / Online</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic">
                            Align the participant's QR code within the target area. The terminal will automatically decrypt and retrieve biometric identifiers from the central registry.
                        </p>
                    </div>
                </div>

                {/* Info Display (Right - 3 cols) */}
                <div className="lg:col-span-3 space-y-8">
                    <h3 className="font-mono text-xs font-black uppercase text-zinc-400 tracking-[0.4em] border-l-4 border-black pl-4">Authorization Feed</h3>
                    
                    {!lookupData && !error ? (
                        <div className="h-full min-h-[400px] border-4 border-dashed border-zinc-100 rounded-[3rem] flex flex-col items-center justify-center text-zinc-300 space-y-6 transition-all hover:bg-zinc-50/50 grayscale opacity-30">
                             <div className="p-8 bg-zinc-50 rounded-full">
                                <UserCheck size={64} />
                             </div>
                             <p className="font-mono text-xs uppercase font-black tracking-widest">Awaiting Identity Input...</p>
                        </div>
                    ) : error ? (
                        <div className="p-12 rounded-[3rem] bg-red-50 border-4 border-red-100 flex flex-col items-center text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="text-red-600" size={40} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black uppercase italic text-red-900 tracking-tighter">Security Alert</h4>
                                <p className="font-mono text-xs text-red-700 mt-2 uppercase font-black tracking-widest">{error}</p>
                            </div>
                            <button onClick={handleRescan} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-red-700 transition-all active:scale-95">Restart Scanner</button>
                        </div>
                    ) : lookupData ? (
                        <div className={`relative p-10 rounded-[3.5rem] border-4 border-black bg-white shadow-2xl transition-all animate-in slide-in-from-right-10 duration-500 overflow-hidden`}>
                            {/* Watermark Background */}
                            <div className="absolute top-10 right-10 opacity-[0.03] rotate-12 pointer-events-none">
                                <ShieldCheck size={200} className="text-black" />
                            </div>

                            <div className="relative z-10 space-y-10">
                                {/* Status Header */}
                                <div className="flex items-center justify-between border-b border-zinc-100 pb-8 mt-2">
                                    <div className="flex items-center gap-4">
                                        {lookupData.alreadyCheckedIn ? (
                                            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full">
                                                <CheckCircle2 size={16} className="text-amber-600" />
                                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-tighter italic">Warning: Multi-Identity Entry Detected</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
                                                <UserCheck size={16} className="text-emerald-600" />
                                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter italic">Identity Verified / Clear for Entry</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="font-mono text-[9px] text-zinc-400 uppercase font-black">Auth ID: {lookupData.registrationId.slice(0,8).toUpperCase()}</span>
                                </div>

                                {/* Main Data Section */}
                                <div className="flex items-start gap-8">
                                    <div className="w-24 h-24 bg-zinc-100 rounded-[2rem] border border-zinc-200 flex items-center justify-center p-2">
                                         <User size={48} className="text-zinc-300" />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-mono uppercase text-zinc-400 font-black tracking-widest mb-1">Participant Identity</p>
                                            <h4 className="text-4xl font-black uppercase italic leading-none text-black tracking-tighter">{lookupData.student.name}</h4>
                                            <p className="font-mono text-sm font-black text-zinc-500 mt-2">USN: {lookupData.student.usn}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="bg-zinc-100 text-black text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-tighter">{lookupData.student.department}</span>
                                            <span className="bg-zinc-100 text-black text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">S{lookupData.student.semester} / Y{lookupData.student.year}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Event Mapping */}
                                <div className="grid grid-cols-2 gap-6 bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-100">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <Hash size={14} />
                                            <span className="text-[10px] font-mono uppercase font-black tracking-widest">Operation Event</span>
                                        </div>
                                        <p className="text-sm font-black uppercase text-black leading-tight">{lookupData.event.title}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <MapPin size={14} />
                                            <span className="text-[10px] font-mono uppercase font-black tracking-widest">Sector Location</span>
                                        </div>
                                        <p className="text-xs font-bold uppercase text-black italic">{lookupData.event.location}</p>
                                    </div>
                                </div>

                                {/* Confirmation Buttons */}
                                <div className="grid grid-cols-2 gap-6 pt-4">
                                    <button 
                                        onClick={handleRescan}
                                        className="bg-zinc-100 text-black py-4 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-sm hover:bg-zinc-200 transition-all active:scale-95 border border-zinc-200"
                                    >
                                        Discard / Rescan
                                    </button>
                                    <button 
                                        onClick={handleConfirm}
                                        disabled={isConfirming || lookupData.alreadyCheckedIn}
                                        className={`py-4 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${
                                            lookupData.alreadyCheckedIn 
                                            ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed grayscale' 
                                            : 'bg-black text-white hover:scale-[1.02] shadow-black/20'
                                        }`}
                                    >
                                        {isConfirming ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 size={14} className="animate-spin" />
                                                Processing Auth...
                                            </span>
                                        ) : lookupData.alreadyCheckedIn ? 'Duplicate Entry Prevented' : 'Authorize Entry ✓'}
                                    </button>
                                </div>

                                {lookupData.alreadyCheckedIn && (
                                    <div className="text-center">
                                        <p className="text-[9px] font-mono text-amber-600 uppercase font-bold italic underline underline-offset-4 animate-pulse">
                                            This token was already utilized at {new Date(lookupData.checkedInAt!).toLocaleTimeString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <style jsx global>{`
                #reader { border: none !important; }
                #reader__scan_region { background: transparent !important; }
                #reader__dashboard_section_csr button {
                    background: black !important;
                    color: white !important;
                    border-radius: 12px !important;
                    padding: 8px 16px !important;
                    font-size: 9px !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.2em !important;
                    border: none !important;
                    margin: 10px 0 !important;
                    cursor: pointer !important;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                }
                #reader__status_span { display: none !important; }
                #reader__camera_selection {
                    background: rgba(0,0,0,0.05) !important;
                    color: black !important;
                    border: 1px solid rgba(0,0,0,0.1) !important;
                    border-radius: 8px !important;
                    padding: 4px 8px !important;
                    font-size: 9px !important;
                    margin-bottom: 10px !important;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}
