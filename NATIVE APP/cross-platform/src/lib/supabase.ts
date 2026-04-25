import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pkpjuqtkzctqjbdmebgb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrcGp1cXRremN0cWpiZG1lYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDUwOTUsImV4cCI6MjA4OTY4MTA5NX0.t3939XDP8mEq3leg5NvONSiMXKilmR8gWt91RYXFiR4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
