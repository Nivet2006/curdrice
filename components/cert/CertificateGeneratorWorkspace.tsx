'use client';

import * as React from 'react';
import { CertProject, CertField, CertRow } from '@/lib/cert/types';
import { INITIAL_PROJECT_STATE, history } from '@/lib/cert/certStore';
import { StepIndicator } from './StepIndicator';
import { Step1UploadTemplate } from './Step1UploadTemplate';
import { Step2PlaceFields } from './Step2PlaceFields';
import { Step3LoadData } from './Step3LoadData';
import { Step4StyleFonts } from './Step4StyleFonts';
import { Step5Generate } from './Step5Generate';
import { Step6Review } from './Step6Review';
import { ManualEntryMode } from './ManualEntryMode';
import { AdminLogs } from './AdminLogs';

interface WorkspaceProps {
  isAdmin?: boolean;
}

export function CertificateGeneratorWorkspace({ isAdmin = false }: WorkspaceProps) {
  const [step, setStep] = React.useState(1);
  const [maxStepReached, setMaxStepReached] = React.useState(1);
  const [project, setProject] = React.useState<CertProject>(INITIAL_PROJECT_STATE);
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(null);

  // Layout metadata from template pdfjs render
  const [canvasDataUrl, setCanvasDataUrl] = React.useState('');
  const [pdfDimensions, setPdfDimensions] = React.useState({ width: 842, height: 595 }); // Standard A4 Landscape pt

  // Manual input form mode bypass toggle
  const [manualEntryMode, setManualEntryMode] = React.useState(false);

  // Desktop PWA install trigger state
  const [pwaInstallPrompt, setPwaInstallPrompt] = React.useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = React.useState(false);

  // Session timer variables
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. PWA Manifest & Install Alert listeners
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      // Suppress on mobile (simple check)
      if (window.innerWidth >= 1024) {
        setPwaInstallPrompt(e);
      }
    });

    window.addEventListener('appinstalled', () => {
      setIsPwaInstalled(true);
      setPwaInstallPrompt(null);
    });

    // 2. Session Countdown modal alert (25 min trigger)
    const timeout = setTimeout(() => {
      const confirmed = confirm('Your Certificate Workspace session will expire in 5 minutes due to inactivity. Press OK to keep active.');
      if (!confirmed) {
        window.location.href = '/login';
      }
    }, 25 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, []);

  // Sync max step milestones
  const setStepWithLimit = (nextStep: number) => {
    if (nextStep <= maxStepReached + 1) {
      setStep(nextStep);
      if (nextStep > maxStepReached) {
        setMaxStepReached(nextStep);
      }
    }
  };

  // Upload handler from Step 1
  const handleTemplateUpload = (
    file: File,
    pdfBytes: ArrayBuffer,
    pageCount: number,
    dimensions: { width: number; height: number; canvasDataUrl: string }
  ) => {
    setCanvasDataUrl(dimensions.canvasDataUrl);
    setPdfDimensions({ width: dimensions.width, height: dimensions.height });
    
    setProject(prev => ({
      ...prev,
      templateFile: file,
      templatePdfBytes: pdfBytes
    }));

    // Auto navigate to step 2 placement editor
    setStepWithLimit(2);
  };

  const updateProjectDetails = (updates: Partial<CertProject>) => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  const handleUpdateFields = (nextFields: CertField[]) => {
    setProject(prev => ({ ...prev, fields: nextFields }));
  };

  const handleUpdateRows = (nextRows: CertRow[]) => {
    setProject(prev => ({ ...prev, rows: nextRows }));
  };

  const handleUpdateFieldMapping = (fieldId: string, colName: string | null) => {
    const nextFields = project.fields.map(f => {
      if (f.id === fieldId) {
        return { ...f, dataColumn: colName };
      }
      return f;
    });
    setProject(prev => ({ ...prev, fields: nextFields }));
  };

  // PWA Install execution
  const installPwa = async () => {
    if (!pwaInstallPrompt) return;
    pwaInstallPrompt.prompt();
    const { outcome } = await pwaInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsPwaInstalled(true);
    }
    setPwaInstallPrompt(null);
  };

  // Extract column mapping headers
  const columnHeaders = project.rows.length > 0 ? Object.keys(project.rows[0].data) : [];

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-[#0a0a0a] dark:text-white leading-none uppercase">
            Certificate Center
          </h1>
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest mt-1.5">
            Administer, design and generate award templates in batches
          </p>
        </div>

        {/* PWA Prompt alert for desktop */}
        {pwaInstallPrompt && !isPwaInstalled && (
          <button
            type="button"
            onClick={installPwa}
            className="px-4 py-2 bg-[#0a0a0a] text-white dark:bg-white dark:text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-102 transition-transform shadow-md"
          >
            📥 Install App to Desktop
          </button>
        )}
      </div>

      {/* Admin specific runs logs tab switcher */}
      {isAdmin && (
        <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs w-fit bg-zinc-50 dark:bg-zinc-900 font-bold mb-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-4 py-2 ${step !== 7 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-transparent text-zinc-500'}`}
          >
            🛠 Generator Wizard
          </button>
          <button
            type="button"
            onClick={() => setStep(7)}
            className={`px-4 py-2 ${step === 7 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-transparent text-zinc-500'}`}
          >
            📋 Admin Logs History
          </button>
        </div>
      )}

      {step !== 7 && (
        <>
          {/* Stepsindicator */}
          {!manualEntryMode && (
            <StepIndicator
              currentStep={step}
              maxStepReached={maxStepReached}
              onStepClick={(s) => setStep(s)}
            />
          )}

          {/* Wizard step routes controller */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-sm min-h-[450px]">
            {manualEntryMode ? (
              <ManualEntryMode
                fields={project.fields}
                templatePdfBytes={project.templatePdfBytes!}
                onSaveToQueue={(row) => {
                  setProject(prev => ({ ...prev, rows: [...prev.rows, row] }));
                  setManualEntryMode(false);
                  setStepWithLimit(5); // Go directly to generation queue
                }}
                onAddField={(label) => {
                  const newF: CertField = {
                    id: `field_${Date.now()}`,
                    label,
                    dataColumn: label,
                    x: 100,
                    y: 100,
                    width: 200,
                    height: 40,
                    rotation: 0,
                    fontFamily: 'Inter',
                    fontSize: 24,
                    fontWeight: 400,
                    fontStyle: 'normal',
                    underline: false,
                    strikethrough: false,
                    color: '#0a0a0a',
                    opacity: 100,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    letterSpacing: 0,
                    lineHeight: 1.2,
                    textTransform: 'none',
                    textShadow: null,
                    zIndex: project.fields.length + 1,
                    locked: false,
                    pageIndex: 0,
                    coordSpace: 'pdf-points'
                  };
                  setProject(prev => ({ ...prev, fields: [...prev.fields, newF] }));
                }}
                onExit={() => setManualEntryMode(false)}
              />
            ) : (
              <>
                {step === 1 && (
                  <Step1UploadTemplate
                    templateFile={project.templateFile}
                    onUpload={handleTemplateUpload}
                    manualMode={manualEntryMode}
                    onToggleManualMode={setManualEntryMode}
                  />
                )}

                {step === 2 && canvasDataUrl && (
                  <Step2PlaceFields
                    fields={project.fields}
                    onChange={handleUpdateFields}
                    canvasDataUrl={canvasDataUrl}
                    pdfWidth={pdfDimensions.width}
                    pdfHeight={pdfDimensions.height}
                    selectedFieldId={selectedFieldId}
                    onSelectField={setSelectedFieldId}
                  />
                )}

                {step === 3 && (
                  <Step3LoadData
                    fields={project.fields}
                    rows={project.rows}
                    onChangeRows={handleUpdateRows}
                    onUpdateFieldMapping={handleUpdateFieldMapping}
                    initialEventId={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('eventId') : null}
                  />
                )}

                {step === 4 && (
                  <Step4StyleFonts
                    project={project}
                    onChangeProject={updateProjectDetails}
                    headers={columnHeaders}
                  />
                )}

                {step === 5 && (
                  <Step5Generate
                    project={project}
                    onChangeRows={handleUpdateRows}
                    onAdvanceToReview={() => setStepWithLimit(6)}
                  />
                )}

                {step === 6 && (
                  <Step6Review
                    project={project}
                    onChangeRows={handleUpdateRows}
                  />
                )}
              </>
            )}
          </div>

          {/* Flow Wizard bottom Nav Buttons bar */}
          {!manualEntryMode && step < 6 && project.templateFile && (
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-3xl font-bold text-xs uppercase tracking-wider">
              <button
                type="button"
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl border border-zinc-200 hover:border-black dark:border-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ◀ Back Step
              </button>

              <button
                type="button"
                onClick={() => setStepWithLimit(step + 1)}
                disabled={step === 5 && project.rows.length === 0}
                className="px-4 py-2 bg-[#0a0a0a] text-white dark:bg-white dark:text-black rounded-xl hover:scale-103 active:scale-97 transition-all shadow-md"
              >
                Next Step ▶
              </button>
            </div>
          )}
        </>
      )}

      {step === 7 && isAdmin && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-sm">
          <AdminLogs />
        </div>
      )}
    </div>
  );
}
