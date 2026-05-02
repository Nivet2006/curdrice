'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, ChevronLeft, Save, Loader2, Download, ExternalLink, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const StudentAutocomplete = ({ rpIdx, isUsn, placeholder, formData, studentsList, updateForm }: { rpIdx: number, isUsn: boolean, placeholder: string, formData: any, studentsList: any[], updateForm: (key: string, value: any) => void }) => {
  const rp = formData.resource_persons[rpIdx];
  if (!rp) return null;
  const value = isUsn ? rp.usn : rp.name;
  const [showDropdown, setShowDropdown] = useState(false);
  
  const terms = (value || '').split(';');
  const currentTerm = terms[terms.length - 1] || '';
  const cleanTerm = currentTerm.trim();

  const filtered = cleanTerm.length > 0 ? studentsList.filter(s => 
    isUsn ? s.usn.toLowerCase().includes(cleanTerm.toLowerCase()) : s.name.toLowerCase().includes(cleanTerm.toLowerCase())
  ).slice(0, 5) : [];

  return (
    <div className="relative">
      <input 
        type="text" 
        className="w-full border border-zinc-300 rounded-lg p-3 text-sm" 
        placeholder={placeholder}
        value={value || ''}
        onChange={e => {
          const newRp = [...formData.resource_persons];
          if (isUsn) newRp[rpIdx].usn = e.target.value;
          else newRp[rpIdx].name = e.target.value;
          updateForm('resource_persons', newRp);
          setShowDropdown(true);
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        onFocus={() => setShowDropdown(true)}
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((s, i) => (
            <div 
              key={i} 
              className="px-4 py-2 hover:bg-zinc-100 cursor-pointer text-sm"
              onClick={() => {
                const newRp = [...formData.resource_persons];
                
                // Reconstruct string
                const nameTerms = (newRp[rpIdx].name || '').split(';');
                nameTerms[nameTerms.length - 1] = ' ' + s.name;
                newRp[rpIdx].name = nameTerms.join(';').trim() + '; ';
                
                const usnTerms = (newRp[rpIdx].usn || '').split(';');
                usnTerms[usnTerms.length - 1] = ' ' + s.usn;
                newRp[rpIdx].usn = usnTerms.join(';').trim() + '; ';
                
                updateForm('resource_persons', newRp);
                setShowDropdown(false);
              }}
            >
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-zinc-500">{s.usn}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function MultiStepReportForm({ eventId, eventTitle, eventDate, department, existingReport, studentCount }: any) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [studentsList, setStudentsList] = useState<{name: string, usn: string}[]>([]);
  const [studentSearchMap, setStudentSearchMap] = useState<{[key: number]: string}>({});
  
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
    photo_1_url: '',
    photo_2_url: '',
    resource_persons: [],
    faculty_coordinators: [''],
    student_coordinators: [''],
  });

  // Fetch students on mount for the autocomplete feature
  import('react').then((React) => {
    React.useEffect(() => {
      const fetchStudents = async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase.from('profiles').select('full_name, usn').eq('role', 'student');
          if (data) {
            setStudentsList(data.map(d => ({ name: d.full_name, usn: d.usn })));
          }
        } catch (e) {
          console.error(e);
        }
      }
      fetchStudents();
    }, []);
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
        setGeneratedPdfUrl(data.pdfUrl || '');
      } else {
        const errorData = await res.json();
        alert(`Failed to generate report: ${errorData.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`An error occurred: ${e.message}`);
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

      {/* ── SUCCESS SCREEN ── */}
      {generatedPdfUrl !== null ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#1A1A2E]">Report Generated!</h2>
            <p className="text-zinc-500 text-sm max-w-sm">
              Your IIC Activity Report PDF has been successfully created and stored.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            {generatedPdfUrl && (
              <a
                href={generatedPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1F3A8A] to-[#2563EB] text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <ExternalLink size={16} />
                View Report PDF
              </a>
            )}
            <Link
              href={`/cc/events/${eventId}`}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-zinc-200 text-zinc-700 font-semibold rounded-xl hover:border-zinc-400 hover:text-black transition-all"
            >
              <FileText size={16} />
              Back to Event
            </Link>
          </div>

          <button
            onClick={() => setGeneratedPdfUrl(null)}
            className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2 transition-colors"
          >
            Edit &amp; Re-generate Report
          </button>
        </div>
      ) : (
        <>
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
            
            <div className="space-y-4 mt-6">
               <h3 className="font-bold text-sm text-[#1A1A2E]">Photo Collages</h3>
               <div>
                 <label className="block text-sm font-medium mb-1">Image Link 1</label>
                 <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" placeholder="https://example.com/image1.jpg" value={formData.photo_1_url || ''} onChange={e => updateForm('photo_1_url', e.target.value)} />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1">Image Link 2</label>
                 <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" placeholder="https://example.com/image2.jpg" value={formData.photo_2_url || ''} onChange={e => updateForm('photo_2_url', e.target.value)} />
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
            
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 space-y-6">
               <h3 className="font-bold text-sm text-[#1A1A2E]">Resource Persons</h3>
               {formData.resource_persons.map((rp: any, idx: number) => {
                 const isInternal = formData.level === 'Institute' || formData.level === 'Department';

                 return (
                   <div key={idx} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative space-y-4">
                     <button onClick={() => {
                       const newRp = [...formData.resource_persons];
                       newRp.splice(idx, 1);
                       updateForm('resource_persons', newRp);
                     }} className="absolute top-4 right-4 text-red-500 text-xs font-bold hover:text-red-700">Remove</button>
                     
                     <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Entry {idx + 1}</h4>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {isInternal ? (
                         <>
                           <div>
                             <label className="block text-xs font-medium mb-1">Student Name (separate with ;)</label>
                             <StudentAutocomplete rpIdx={idx} isUsn={false} placeholder="Start typing name..." formData={formData} studentsList={studentsList} updateForm={updateForm} />
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">USN (separate with ;)</label>
                             <StudentAutocomplete rpIdx={idx} isUsn={true} placeholder="Start typing USN..." formData={formData} studentsList={studentsList} updateForm={updateForm} />
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">Department</label>
                             <select 
                               className="w-full border border-zinc-300 rounded-lg p-3 text-sm bg-white"
                               value={rp.department || ''} 
                               onChange={e => {
                                 const newRp = [...formData.resource_persons];
                                 newRp[idx].department = e.target.value;
                                 updateForm('resource_persons', newRp);
                               }}
                             >
                               <option value="">Select Dept</option>
                               <option value="CSE">CSE</option>
                               <option value="ECE">ECE</option>
                               <option value="AERO">AERO</option>
                               <option value="ISE">ISE</option>
                               <option value="MECH">MECH</option>
                               <option value="CIVIL">CIVIL</option>
                             </select>
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">Designation</label>
                             <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm bg-zinc-100 cursor-not-allowed" value="STUDENT" readOnly />
                           </div>
                         </>
                       ) : (
                         <>
                           <div>
                             <label className="block text-xs font-medium mb-1">Name of the Speaker/Expert</label>
                             <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={rp.name || ''} onChange={e => { const newRp = [...formData.resource_persons]; newRp[idx].name = e.target.value; updateForm('resource_persons', newRp); }} />
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">Industry/Company/Organization</label>
                             <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={rp.organization || ''} onChange={e => { const newRp = [...formData.resource_persons]; newRp[idx].organization = e.target.value; updateForm('resource_persons', newRp); }} />
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">Designation</label>
                             <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={rp.designation || ''} onChange={e => { const newRp = [...formData.resource_persons]; newRp[idx].designation = e.target.value; updateForm('resource_persons', newRp); }} />
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">Address of the Speaker</label>
                             <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={rp.address || ''} onChange={e => { const newRp = [...formData.resource_persons]; newRp[idx].address = e.target.value; updateForm('resource_persons', newRp); }} />
                           </div>
                         </>
                       )}
                       
                       <div>
                         <label className="block text-xs font-medium mb-1">Mobile Number (WhatsApp)</label>
                         <input type="text" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={rp.mobile || ''} onChange={e => { const newRp = [...formData.resource_persons]; newRp[idx].mobile = e.target.value; updateForm('resource_persons', newRp); }} />
                       </div>
                       <div>
                         <label className="block text-xs font-medium mb-1">E-mail id</label>
                         <input type="email" className="w-full border border-zinc-300 rounded-lg p-3 text-sm" value={rp.email || ''} onChange={e => { const newRp = [...formData.resource_persons]; newRp[idx].email = e.target.value; updateForm('resource_persons', newRp); }} />
                       </div>
                     </div>
                   </div>
                 );
               })}
               
               <button onClick={() => {
                 const isInternal = formData.level === 'Institute' || formData.level === 'Department';
                 const newPerson = isInternal 
                    ? { name: '', usn: '', department: '', designation: 'STUDENT', mobile: '', email: '' }
                    : { name: '', organization: '', designation: '', mobile: '', email: '', address: '' };
                 
                 const newRp = [...formData.resource_persons, newPerson];
                 updateForm('resource_persons', newRp);
               }} className="flex items-center gap-2 px-4 py-2 bg-[#1F3A8A] text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors">
                 + Add Resource Person
               </button>
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
      </>
      )}
    </div>
  );
}
