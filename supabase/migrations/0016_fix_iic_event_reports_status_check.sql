-- Migration 0016: Fix iic_event_reports_status_check Constraint
-- Drops the old status constraint and replaces it with the full workflow status options.

ALTER TABLE public.iic_event_reports DROP CONSTRAINT IF EXISTS iic_event_reports_status_check;

ALTER TABLE public.iic_event_reports ADD CONSTRAINT iic_event_reports_status_check CHECK (
    status IN (
        'draft',
        'generated',
        'pending_pr',
        'approved_pr',
        'rejected_pr',
        'pending_faculty',
        'approved_faculty',
        'rejected_faculty',
        'pending_hod',
        'approved',
        'rejected_hod'
    )
);
