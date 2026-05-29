'use client';

import * as React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  maxStepReached: number;
  onStepClick: (step: number) => void;
}

const STEPS = [
  'Upload Template',
  'Place Fields',
  'Load Data',
  'Style & Fonts',
  'Generate',
  'Review & Export'
];

export function StepIndicator({ currentStep, maxStepReached, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex items-center gap-2 min-w-max px-2">
        {STEPS.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep || stepNum <= maxStepReached;
          const isCurrent = stepNum === currentStep;
          const isAccessible = stepNum <= maxStepReached + 1;

          return (
            <React.Fragment key={label}>
              {index > 0 && (
                <div
                  className={`h-0.5 w-6 transition-colors duration-300 ${
                    stepNum <= currentStep ? 'bg-[#0a0a0a] dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
                />
              )}
              <button
                type="button"
                disabled={!isAccessible}
                onClick={() => isAccessible && onStepClick(stepNum)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-[#0a0a0a] text-white dark:bg-white dark:text-black shadow-lg scale-102'
                    : isCompleted
                    ? 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black text-black dark:text-white cursor-pointer'
                    : 'bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    isCurrent
                      ? 'bg-white text-black dark:bg-black dark:text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {isCompleted && stepNum < currentStep ? '✓' : stepNum}
                </div>
                <span>{label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
