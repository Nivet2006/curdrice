'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, ChevronLeft, Save, Loader2, Upload } from 'lucide-react';

export function MultiStepReportForm({ eventId, eventTitle, eventDate, department, existingReport, studentCount }: any) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // To avoid timezone shift, safely parse date
  const formattedDate = eventDate ? (typeof eventDate === 'string' ? eventDate.split('T')[0] : new Date(eventDate).toISOString().split('T')[0]) : '';

  const [formData, setFormData] = useState(existingReport || {
    activity_name: eventTitle || '',
    thrust_area: 'Innovation',
    level: 'Institute',
    semester: 'Odd Sem Jul–Dec',
    quarter: 'Q1',
    event_date: formattedDate,
    duration_minutes: 60,
    faculty_count: 0,
    student_count: studentCount || 0,
    funds_used: 0,
    department: department || '',
    objective: '',
    summary: '',
    benefits: '',
    attendance_sheet: 'Internal',
    instagram_link: '',
    facebook_link: '',
    twitter_link: '',
    resource_persons: [],
    faculty_coordinators: [''],
    student_coordinators: [''],
  });

  const updateForm = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ...formData })
      });
      if (res.ok) {
        const data = await res.json();
        // Force refresh or redirect to download
        window.location.reload();
      } else {
        alert("Failed to generate report.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(5, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-200 -z-10"></div>
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
          step > s ? 'bg-[#16A34A] border-[#16A34A] text-white' : 
          step === s ? 'bg-[#1F3A8A] border-[#1F3A8A] text-white' : 
          'bg-white border-zinc-300 text-zinc-400'
        }`}>
          {step > s ? <CheckCircle2 size={20} /> : <span className="font-bold">{s}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white border border-zinc-200 rounded-[12px] p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] max-w-[760px] mx-auto">
      {renderStepIndicator()}

      <div className="space-y-6 min-h-[400px]">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-bold text-[#1A1A2E]">Step 1: Event Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Activity Name</label>
                <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={formData.activity_name} onChange={e => updateForm('activity_name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thrust Area</label>
                <select className="w-full border border-zinc-300 rounded-lg p-3 text-sm bg-white" value={formData.thrust_area} onChange={e => updateForm('thrust_area', e.target.value)}>
                  <option>Innovation</option>
                  <option>Entrepreneurship</option>
                  <option>Research</option>
                  <option>IPR</option>
                  <option>Startups</option>
                  <option>Others</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Level of Activity</label>
                <select className="w-full border border-zinc-300 rounded-lg p-3 text-sm bg-white" value={formData.level} onChange={e => updateForm('level', e.target.value)}>
                  <option>Institute</option>
                  <option>Department</option>
                  <option>National</option>
                  <option>International</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Semester</label>
                <select className="w-full border border-zinc-300 rounded-lg p-3 text-sm bg-white" value={formData.semester} onChange={e => updateForm('semester', e.target.value)}>
                  <option>Odd Sem Jul–Dec</option>
                  <option>Even Sem Jan–Jun</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quarter</label>
                <select className="w-full border border-zinc-300 rounded-lg p-3 text-sm bg-white" value={formData.quarter} onChange={e => updateForm('quarter', e.target.value)}>
                  <option>Q1</option>
                  <option>Q2</option>
                  <option>Q3</option>
                  <option>Q4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" className="w-full border border-zinc-300 rounded-lg p-3 text-sm bg-zinc-100 text-zinc-600 cursor-not-allowed" value={formData.event_date} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (mins)</label>
                <input type="number" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={formData.duration_minutes} onChange={e => updateForm('duration_minutes', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Faculty Count</label>
                <input type="number" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={formData.faculty_count} onChange={e => updateForm('faculty_count', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Student Count</label>
                <input type="number" className="w-full border border-zinc-300 rounded-lg p-3 text-sm bg-zinc-100 text-zinc-600 cursor-not-allowed" value={formData.student_count} readOnly />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-bold text-[#1A1A2E]">Step 2: Narrative</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={formData.department} onChange={e => updateForm('department', e.target.value)} placeholder="e.g. Computer Science and Engineering" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Objective</label>
              <textarea className="w-full border border-zinc-300 rounded-lg p-3 text-sm min-h-[120px] resize-y" placeholder="State the purpose, IIC alignment, learning outcomes..." value={formData.objective} onChange={e => updateForm('objective', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Summary</label>
              <textarea className="w-full border border-zinc-300 rounded-lg p-3 text-sm min-h-[120px] resize-y" placeholder="Describe activity nature, key sessions..." value={formData.summary} onChange={e => updateForm('summary', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Benefits</label>
              <textarea className="w-full border border-zinc-300 rounded-lg p-3 text-sm min-h-[120px] resize-y" placeholder="Outline knowledge, skills, exposure..." value={formData.benefits} onChange={e => updateForm('benefits', e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-bold text-[#1A1A2E]">Step 3: Documents Info</h2>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-6">
              <p className="text-sm text-blue-800">Photos and screenshots will be automatically embedded into the final PDF. Ensure they are clear and readable.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Attendance Sheet</label>
              <select className="w-full border border-zinc-300 rounded-lg p-3 text-sm bg-white" value={formData.attendance_sheet} onChange={e => updateForm('attendance_sheet', e.target.value)}>
                <option>Internal</option>
                <option>External</option>
              </select>
            </div>
            
            <div className="space-y-3">
               <label className="block text-sm font-medium mb-1">Upload Photo Collages (min 2)</label>
               <div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 flex flex-col items-center justify-center bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors">
                  <Upload className="text-zinc-400 mb-2" />
                  <span className="text-sm text-zinc-500">Click to select files (simulated for now)</span>
               </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-bold text-[#1A1A2E]">Step 4: Socials & Resource Persons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Instagram Link</label>
                <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={formData.instagram_link} onChange={e => updateForm('instagram_link', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Facebook Link</label>
                <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={formData.facebook_link} onChange={e => updateForm('facebook_link', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Twitter Link</label>
                <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={formData.twitter_link} onChange={e => updateForm('twitter_link', e.target.value)} />
              </div>
            </div>
            
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50">
               <h3 className="font-bold text-sm mb-3">Resource Persons</h3>
               {formData.resource_persons.map((rp: any, idx: number) => (
                 <div key={idx} className="bg-white p-3 rounded border border-zinc-200 mb-2 flex justify-between items-center text-sm">
                   <span>{rp.name} - {rp.organization}</span>
                   <button onClick={() => {
                     const newRp = [...formData.resource_persons];
                     newRp.splice(idx, 1);
                     updateForm('resource_persons', newRp);
                   }} className="text-red-500 text-xs">Remove</button>
                 </div>
               ))}
               <button onClick={() => {
                 const newRp = [...formData.resource_persons, { name: 'New Person', organization: 'Company', designation: 'Role' }];
                 updateForm('resource_persons', newRp);
               }} className="text-sm text-blue-600 font-medium">+ Add Resource Person</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-bold text-[#1A1A2E]">Step 5: Coordinators & Sign-off</h2>
            <div>
               <label className="block text-sm font-medium mb-1">Faculty Coordinators (comma separated)</label>
               <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={formData.faculty_coordinators.join(', ')} onChange={e => updateForm('faculty_coordinators', e.target.value.split(',').map(s => s.trim()))} />
            </div>
            <div>
               <label className="block text-sm font-medium mb-1">Student Coordinators (comma separated)</label>
               <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={formData.student_coordinators.join(', ')} onChange={e => updateForm('student_coordinators', e.target.value.split(',').map(s => s.trim()))} />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
               <p className="text-sm text-yellow-800 font-medium text-center">Digital Signatures can be enclosed upon verification.</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-100">
        <button 
          onClick={prevStep}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 text-zinc-500 font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 rounded-lg transition-colors"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        
        {step < 5 ? (
          <button 
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2 bg-[#1A1A2E] text-white rounded-lg font-medium hover:bg-black transition-all"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#1F3A8A] to-[#2563EB] text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:hover:scale-100"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Generate Official PDF
          </button>
        )}
      </div>
    </div>
  );
}
