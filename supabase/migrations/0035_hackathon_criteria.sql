-- Add hackathon config columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS hackathon_criteria jsonb DEFAULT '[
  {"name": "Innovation", "max_points": 20},
  {"name": "Technical", "max_points": 20},
  {"name": "Design/UX", "max_points": 20},
  {"name": "Presentation", "max_points": 20}
]'::jsonb;

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_evaluation_criteria boolean DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_scoreboard boolean DEFAULT false;
