-- Add pdf_annotations column to iic_event_reports for storing drawing/pin coordinate markings
ALTER TABLE iic_event_reports 
ADD COLUMN IF NOT EXISTS pdf_annotations jsonb DEFAULT '[]'::jsonb;
