-- Seed requested default venues
INSERT INTO public.venues (name, capacity, description) VALUES
('6TH FLOOR seminar hall', 150, 'Spacious seminar hall located on the 6th floor'),
('4th floor cse auditorium', 200, 'Auditorium located on the 4th floor, CSE department'),
('aiml 1st floor', 120, 'AIML Seminar / Lab space located on the 1st floor')
ON CONFLICT (name) DO NOTHING;
