-- Migration 0022: Allow Teacher role to insert faculty events
-- Teachers (faculty) need to create events that go directly to HOD for approval.
-- The existing INSERT policy only allows: cc, manager, admin.
-- This migration adds 'teacher' to the allowed roles for event inserts.

-- Drop old policy and recreate with teacher included
DROP POLICY IF EXISTS "CC and Managers can insert events" ON public.events;

CREATE POLICY "CC, Teachers and Managers can insert events"
ON public.events FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('cc', 'manager', 'admin', 'teacher')
  )
);

-- Also allow teachers to manage constraints for events they created
DROP POLICY IF EXISTS "Staff can manage constraints for their events" ON public.event_constraints;

CREATE POLICY "Staff can manage constraints for their events"
ON public.event_constraints FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_constraints.event_id
    AND events.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('cc', 'manager', 'admin', 'teacher')
  )
);
